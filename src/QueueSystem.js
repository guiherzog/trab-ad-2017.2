const { Queue } = require('./Queue');
const { Customer } = require('./Customer');
const { Utils } = require('./Utils');


/* 
	Classe principal responsável por controlar todo o sistema.
*/
class QueueSystem {

	constructor(){
		//this.queue1 = new Queue('LCFS', 1, 1.2, 0.2); // type, priority, arrivalRate, serviceRate
		//this.queue2 = new Queue('LCFS', 1, 1.2, 0.2);
		//this.customer = new Customer();

		this.currentCustomers;
		this.currentRounds;
		this.currentRho;
	}

	runSimulation(nCustomers, nRounds, rho){

		let lambda = rho/2;
		let mi = 1/2;


		// cria fila
		//let fila = new Queue('FCFS', 1, lambda, mi); // type, priority, arrivalRate, serviceRate


		// E: T1, W1, N1, Nq1
		//    T2, W2, N2, Nq2
		
		// Var: W1, W2


		let results = [];

		for(let i = 0; i < nRounds; i++) {
			let roundResult = this.runRound(nCustomers, lambda, mi);
			results.push(roundResult);
			console.log(roundResult);
		}

		

	}

	runRound(nCustomers, lambda, mi) {
		// cria fregueses e adiciona na fila
		let customers = [];

		// primeiro freguês
		let arrival = Utils.getRandomExp(lambda);
		let executionStart = arrival;

		let serviceTime = Utils.getRandomExp(mi);

		let customer = new Customer(arrival, executionStart, serviceTime, 0, 0);
		customers.push(customer);


		// fregueses depois do primeiro
		for(let i = 1; i < nCustomers; i++) {
			arrival += Utils.getRandomExp(lambda);
			executionStart = Math.max(arrival, customers[i-1].executionEnd);

			serviceTime = Utils.getRandomExp(mi);

			// pessoas na fila com executionStart > arrival do atual;
			let Nq = 0;
			for(let j = i-1; j >= 0; j--) {
				let c = customers[j];
				if(c.executionStart >= arrival) Nq++;
				else break;
			}

			// tem alguém que satisfaz executionStart <= arrival <= executionEnd
			let Ns = 0;
			for(let j = i-1; j >= 0; j--) {
				let c = customers[j];

				if(arrival <= c.executionEnd && arrival > c.executionStart) {
					Ns++;
					break;
				}

				if(c.executionEnd < arrival)
					break;
			}

			//console.log("Nq = " + Nq + ", Ns = " + Ns);

			let customer = new Customer(arrival, executionStart, serviceTime, Nq, Ns);
			customers.push(customer);
		}


		//console.log(customers);

		let waitSum = 0;
		for(let i = 0; i < nCustomers; i++) waitSum += customers[i].wait;
		let waitAvg = waitSum / nCustomers;

		let serviceSum = 0;
		for(let i = 0; i < nCustomers; i++) serviceSum += customers[i].serviceTime;
		let serviceAvg = serviceSum / nCustomers;

		let timeAvg = waitAvg + serviceAvg;


		let nQueueSum = 0;
		for(let i = 0; i < nCustomers; i++) nQueueSum += customers[i].Nq;
		let nQueueAvg = nQueueSum / nCustomers;

		let nServiceSum = 0;
		for(let i = 0; i < nCustomers; i++) nServiceSum += customers[i].Ns;
		let nServiceAvg = nServiceSum / nCustomers;

		let nAvg = nQueueAvg + nServiceAvg;

		//console.log(`Rodando simulação com ${nCustomers} fregueses e ${nRounds} partidas com rho = ${rho}`);


		return {
			'waitAvg': waitAvg,       // W
			'serviceAvg': serviceAvg, // X
			'timeAvg': timeAvg,       // T

			'nQueueAvg': nQueueAvg,     // Nq
			'nServiceAvg': nServiceAvg, // Ns
			'nAvg': nAvg,               // N
		}
	}
}

exports.QueueSystem = QueueSystem