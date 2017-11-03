const { Queue } = require('./Queue');
const { Customer } = require('./Customer');

/* 
	Classe principal responsável por controlar todo o sistema.
*/
class QueueSystem {
	constructor(){
		this.queue1 = new Queue('LCFS', 1, 1.2, 0.2);
		this.queue2 = new Queue();
		this.customer = new Customer();
	}

	runSimulation(nCustomers, nRounds){
		console.log(`Rodando simulação com ${nCustomers} fregueses e ${nRounds} partidas`);
	}
}

exports.QueueSystem = QueueSystem