/* 
	Classe responsável por forneces funções auxiliares e genéricas.
*/
class RandExpVar {
	constructor(){
		// Gera um tempo de serviço exponencial e independente de outros.
		this.value = - Math.log(1 - Math.random());
	}

	getValue(){
		return this.value;
	}
}

exports.RandExpVar = RandExpVar;