/* 
	A fila recebe os 4 parâmetros descritos abaixo:
	 - Ordem de Atendimento: 'LCFS', 'FCFS'
	 - Prioridade: 1,2..N
	 - Taxa de Entrada: Lambda
	 - Taxa de Serviço: mi
*/
class Queue {
	constructor(type, priority, arrivalRate){
		this.type = type;
		this.priority = priority;
		this.arrivalRate = arrivalRate;

		// Esperanças:
		this.N;
		this.Nq;
		this.W;
		this.X;

		// Varianças:
		this.varW;
	}
}

exports.Queue = Queue;