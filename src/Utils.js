/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
const seedrandom = require('seedrandom');
const randomSeed = seedrandom('test');

class Utils {
	// Gera um tempo de serviço exponencial e independente de outros.
	static getRandomExp(rate){
		return - Math.log(1 - randomSeed()) / rate;
	}
}

exports.Utils = Utils;