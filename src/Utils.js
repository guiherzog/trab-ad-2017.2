/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
const seedrandom = require('seedrandom');
const chi2inv = require('inv-chisquare-cdf');

/*
	Seeds úteis (testes com 2 fregueses):
		123456: fregues 2 chega durante serviço 1 do fregues 1.
		'test': fregues 2 chega durante serviço 2 do fregues 1 (causando interrupção).
		   240: fregues 2 chega depois do fregues 1 terminar tudo.

	Seeds úteis (testes com 3 fregueses):
		123456: fregues i+1 chega durante serviço 1 do fregues i (sem interrupções).
		'test': fregues 1 é interrompido 2x.
*/
const randomSeed = seedrandom();

let deterministicArrivals;
let deterministicX1;
let deterministicX2;

class Utils {
	// Gera um tempo de serviço exponencial e independente de outros.
	static getRandomExp(rate){
		return - Math.log(1 - randomSeed()) / rate;
	}

	static getDeterministicArrival() {
		if(deterministicArrivals.length > 0)
			return deterministicArrivals.shift();
		else
			return 100;
	}

	static getDeterministicX1() {
		if(deterministicX1.length > 0)
			return deterministicX1.shift();
		else
			return 1;
	}

	static getDeterministicX2() {
		if(deterministicX2.length > 0)
			return deterministicX2.shift();
		else
			return 1;
	}


	static setDeterministicArrivals(v) {
		deterministicArrivals = v;
	}
	static setDeterministicX1s(v) {
		deterministicX1 = v;
	}
	static setDeterministicX2s(v) {
		deterministicX2 = v;
	}

	static getInverseChiSquaredCDF(probability, degreeOfFreedom) {
		return chi2inv.invChiSquareCDF(probability, degreeOfFreedom);
	}

}

exports.Utils = Utils;