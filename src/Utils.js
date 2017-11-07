/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
class Utils {
	// Gera um tempo de serviço exponencial e independente de outros.
	static getRandomExp(rate){
		return - Math.log(1 - Math.random()) / rate;
	}
}

exports.Utils = Utils;