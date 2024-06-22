import axios from 'axios';

export const chessComConfig = {
  baseURL: 'https://api.chess.com/pub/player',
  headers: {
    'User-Agent': 'chessconnect (singhrakshit003@gmail.com)',
  },
};

export const isValidChessComId = async (chesscomId: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${chessComConfig.baseURL}/${chesscomId}`, { headers: chessComConfig.headers });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};