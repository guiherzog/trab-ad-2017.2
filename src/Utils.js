/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
const seedrandom = require('seedrandom');
/*
	Seeds úteis (testes com 2 fregueses):
		123456: fregues 2 chega durante serviço 1 do fregues 1.
		'test': fregues 2 chega durante serviço 2 do fregues 1 (causando interrupção).
		   240: fregues 2 chega depois do fregues 1 terminar tudo.

	Seeds úteis (testes com 3 fregueses):
		123456: fregues i+1 chega durante serviço 1 do fregues i (sem interrupções).
		'test': fregues 1 é interrompido 2x.
*/
const randomSeed = seedrandom('test');

class Utils {
	// Gera um tempo de serviço exponencial e independente de outros.
	static getRandomExp(rate){
		return - Math.log(1 - randomSeed()) / rate;
		//return 1/rate; // determinístico
	}
}

exports.Utils = Utils;