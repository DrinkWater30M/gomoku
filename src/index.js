import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

class Square extends React.Component {
  render() {
    return (
      <button className={this.props.isFill ? "square fill" : "square"} onClick={() => {this.props.onClick()}}>
        {this.props.value}
      </button>
    );
  }
}

class Board extends React.Component {
  renderSquare(i) {
    const winPos = this.props.winPos;
    return (
      <Square 
        isFill={winPos && winPos.includes(i) ? true : false}
        value={this.props.squares[i]}
        onClick={() => {this.props.onClick(i);}}/>
    ); 
  }

  renderBoard(row, col){
    let rows = [];
    for (let i = 0 ; i < row; i++){
      let squares = [];
      for (let j = 0; j < col; j++){
        squares.push(this.renderSquare(i*col + j));
      }
      
      const row = <div className="board-row">{squares}</div>;
      rows.push(row);
    }

    return <div>{rows}</div>;
  }

  render() {
    return this.renderBoard(this.props.row, this.props.col);
  }
}

class Game extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      history: [
        {squares: Array(this.props.row*this.props.col).fill(null),
        currentPos: null,
        },
      ],
      xIsNext: true,
      stepNumber: 0,
      sort:false,
    }
  }

  handleClick(i){
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    const newPos = getPosition(i, this.props.row, this.props.col);
    
    if (calculateWinner(squares, current.currentPos, this.props.row, this.props.col, this.props.rule).winner || squares[i]) {
      return;
    }

    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
        currentPos: newPos, 
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    }); 
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  sort(){
    this.setState({sort:!this.state.sort})
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const {winner, winPos} = 
      calculateWinner(current.squares, current.currentPos, this.props.row, this.props.col, this.props.rule);

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move + ` at (${step.currentPos[0]}, ${step.currentPos[1]})` :
        'Go to game start';
      return (
        <li key={move}>
          <button className={move===this.state.stepNumber ? 'selected' : ''} onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } 
    else if(!current.squares.includes(null)){
      status = 'This match is draw!';
    }
    else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }


    return (

      <div className="game">
        <div className="game-board">
           <Board
            winPos={winPos}
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
            col={this.props.col}
            row={this.props.row}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <div><button onClick={() => this.sort()}>Sort by {this.state.sort ? 'Ascending' : 'Descending'}</button></div>
          <ol>{this.state.sort ? moves.reverse() : moves}</ol>
        </div>
      </div>
    );
  }
}

function getPosition(i, row, col){
  const xPos = i%col;
  const yPos = parseInt(i/col);

  return [xPos, yPos];
}

function calculateWinner(squares, currentPos, row, col, rule) {
  row = parseInt(row); col = parseInt(col); rule = parseInt(rule);
  //
  const xStart = currentPos ? (currentPos[0] - rule + 1 >= 0 ? currentPos[0] - rule + 1 : 0) : null;
  const xEnd = currentPos ? (currentPos[0] + rule - 1 <= col - 1 ? currentPos[0] : col - rule) : null;
  const yStart = currentPos ? (currentPos[1] - rule + 1 >= 0 ? currentPos[1] - rule + 1 : 0) : null;
  const yEnd = currentPos ? (currentPos[1] + rule - 1 <= row - 1 ? currentPos[1] : row - rule) : null;

  //Quet cac vi tri co the chien thang vao mang
  let listWinPos = [];

  //theo hang ngang
  if(currentPos){
    for (let i = xStart; i <= xEnd; i++){
      let winPos = [];
      for(let j = 0; j < rule; j++){
        winPos.push(currentPos[1]*row + i + j);
      }
      listWinPos.push(winPos);
    }

    //theo hang doc
    for (let i = yStart; i <= yEnd; i++){
      let winPos = [];
      for(let j = 0; j < rule; j++){
        winPos.push(i*col + currentPos[0] + j*col);
      }
      listWinPos.push(winPos);
    }

    //theo hang cheo qua trai
    const gapTop = currentPos[0] - xStart <= currentPos[1] - yStart ? currentPos[0] - xStart : currentPos[1] - yStart;
    const gapBottom = currentPos[0] - xEnd <= currentPos[1] - yEnd ? currentPos[1] - yEnd : currentPos[0] - xEnd;
    const pointStart = [currentPos[0] - gapTop, currentPos[1] - gapTop];
    const pointEnd = [currentPos[0] - gapBottom, currentPos[1] + gapBottom];
    for (let i = pointStart[0]; i <= pointEnd[0]; i++){
      let winPos = []
      for(let j = 0; j < rule; j++){
        //x: i + j, y: i + j + (currentPos[1] - currentPos[0])
        winPos.push((i + j  + (currentPos[1] - currentPos[0]))*col + i + j);
      }
      listWinPos.push(winPos);
    }
    //theo hang cheo qua phai
    const gapTop2 = 
      currentPos[0] - xStart <= yEnd + rule - 1 - currentPos[1] 
        ? currentPos[0] - xStart 
        : yEnd + rule - 1 - currentPos[1];
    const gapBottom2 = 
      xEnd + rule - 1 - currentPos[0] <= currentPos[1] - yStart 
        ?  xEnd + rule - 1 - currentPos[0] 
        : currentPos[1] - yStart;
    const pointStart2 = [currentPos[0] - gapTop2, currentPos[1] + gapTop2];
    const pointEnd2 = [currentPos[0] + gapBottom2 - rule + 1, currentPos[1] - gapBottom2 + rule - 1];
    for (let i = pointStart2[0]; i <= pointEnd2[0]; i++){
      let winPos = []
      for(let j = 0; j < rule; j++){
        //x: i + j, y: (currentPos[0] + currentPos[1]) - i - j)
        winPos.push(((currentPos[0] + currentPos[1]) - i - j )*col + i + j);
      }
      listWinPos.push(winPos);
    }
    
    //kiem tra chien thang
    const player = squares[currentPos[1]*col + currentPos[0]];
    for (let i = 0; i <  listWinPos.length; i++){
      let isWin = true;
      for(let j = 0; j < rule; j++){
        if(squares[listWinPos[i][j]] !== player){
          isWin = false;
          break;
        }
      }
      
      if(isWin){
        return {winner: player, winPos: listWinPos[i]}
      }
    }
  }
  return {winner:null, winPos:null};
}


// ========================================

const row = prompt('Số hàng: ');
const col = prompt('Số cột: ');
const ruleToWinner = prompt('Số kí hiệu liên tiếp để Win: ');
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game col={col} row={row} rule={ruleToWinner}/>);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
