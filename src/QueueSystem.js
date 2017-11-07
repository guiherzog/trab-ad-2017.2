const { Queue } = require('./Queue');
const { Customer } = require('./Customer');

/* 
	Classe principal responsável por controlar todo o sistema.
*/
class QueueSystem {
	constructor(){
		this.queue1 = new Queue('LCFS', 1, 1.2, 0.2);
		this.queue2 = new Queue('LCFS', 1, 1.2, 0.2);
		this.customer = new Customer();

		this.currentCustomers;
		this.currentRounds;
		this.currentRho;
	}

	runSimulation(nCustomers, nRounds, rho){
		console.log(`Rodando simulação com ${nCustomers} fregueses e ${nRounds} partidas com rho = ${rho}`);
	}
}

exports.QueueSystem = QueueSystem