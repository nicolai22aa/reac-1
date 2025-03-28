import { useState, useEffect } from "react";
import { db } from "./firebaseConfig"; // ✅ Importación correcta
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore"; // ✅ Importación directa de Firestore
import "./App.css";

const rows = 10, cols = 10, mines = 10;

const App = () => {
  const [board, setBoard] = useState([]);
  const [mineCount, setMineCount] = useState(mines);
  const [gameOver, setGameOver] = useState(false);
  const [losses, setLosses] = useState(0);
  const [lossDocId, setLossDocId] = useState(null); // Para actualizar las pérdidas

  useEffect(() => {
    createBoard();
    loadLosses(); // 📌 Cargar datos de Firebase al iniciar
  }, []);

  const createBoard = () => {
    let newBoard = Array.from({ length: rows }, () => 
      Array(cols).fill(null).map(() => ({ 
        mine: false, revealed: false, flag: false, count: 0 
      }))
    );
    setMineCount(mines);
    setGameOver(false);
    placeMines(newBoard);
    calculateNumbers(newBoard);
    setBoard(newBoard);
  };

  const placeMines = (newBoard) => {
    let placed = 0;
    while (placed < mines) {
      let r = Math.floor(Math.random() * rows);
      let c = Math.floor(Math.random() * cols);
      if (!newBoard[r][c].mine) {
        newBoard[r][c].mine = true;
        placed++;
      }
    }
  };

  const calculateNumbers = (newBoard) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newBoard[r][c].mine) continue;
        let count = 0;
        directions.forEach(([dr, dc]) => {
          let nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].mine) {
            count++;
          }
        });
        newBoard[r][c].count = count;
      }
    }
  };

  const revealCell = (r, c) => {
    if (gameOver || board[r][c].flag || board[r][c].revealed) return;

    let newBoard = [...board];
    newBoard[r][c].revealed = true;
    
    if (newBoard[r][c].mine) {
      setGameOver(true);
      setLosses(prevLosses => {
        const newLosses = prevLosses + 1;
        saveLoss(newLosses); // 📌 Guardar la nueva cantidad en Firebase
        return newLosses;
      });
      newBoard.forEach(row => row.forEach(cell => (cell.revealed = true)));
    } else if (newBoard[r][c].count === 0) {
      revealAdjacent(newBoard, r, c);
    }

    setBoard(newBoard);
  };

  const revealAdjacent = (newBoard, r, c) => {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    directions.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].revealed && !newBoard[nr][nc].flag) {
        newBoard[nr][nc].revealed = true;
        if (newBoard[nr][nc].count === 0) {
          revealAdjacent(newBoard, nr, nc);
        }
      }
    });
  };

  const toggleFlag = (e, r, c) => {
    e.preventDefault();
    if (gameOver || board[r][c].revealed) return;
    let newBoard = [...board];
    newBoard[r][c].flag = !newBoard[r][c].flag;
    setMineCount(mineCount + (newBoard[r][c].flag ? -1 : 1));
    setBoard(newBoard);
  };

  const saveLoss = async (newLosses) => {
    try {
      if (lossDocId) {
        const lossRef = doc(db, "estadisticas", lossDocId);
        await updateDoc(lossRef, { perdidas: newLosses });
      } else {
        const docRef = await addDoc(collection(db, "estadisticas"), { perdidas: newLosses });
        setLossDocId(docRef.id);
      }
      console.log("Partida perdida guardada en Firebase");
    } catch (error) {
      console.error("Error al guardar la partida:", error);
    }
  };

  const loadLosses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "estadisticas"));
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        setLosses(docData.data().perdidas);
        setLossDocId(docData.id);
      }
    } catch (error) {
      console.error("Error al leer las partidas:", error);
    }
  };

  return (
    <div className="container">
      <h1>Buscaminas</h1>
      <p>Minas restantes: {mineCount}</p>
      <p>Partidas Perdidas: {losses}</p>
      <div className="board">
        {board.map((row, r) => 
          row.map((cell, c) => (
            <div 
              key={`${r}-${c}`} 
              className={`cell ${cell.revealed ? "revealed" : ""} ${cell.mine ? "mine" : ""}`} 
              onClick={() => revealCell(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
            >
              {cell.revealed ? (cell.mine ? "💣" : cell.count > 0 ? cell.count : "") : (cell.flag ? "🚩" : "")}
            </div>
          ))
        )}
      </div>
      <button onClick={createBoard}>Volver a Jugar</button>
    </div>
  );
};

export default App;
