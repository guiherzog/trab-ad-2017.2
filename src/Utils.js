/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
const seedrandom = require('seedrandom');
/*
	Seeds úteis (testes com 2 fregueses):
		123456: fregues 2 chega durante serviço 1 do fregues 1.
		'test': fregues 2 chega durante serviço 2 do fregues 1 (causando interrupção).
		   240: fregues 2 chega depois do fregues 1 terminar tudo.
*/
const randomSeed = seedrandom(123456);

class Utils {
	// Gera um tempo de serviço exponencial e independente de outros.
	static getRandomExp(rate){
		return - Math.log(1 - randomSeed()) / rate;
	}
}

exports.Utils = Utils;