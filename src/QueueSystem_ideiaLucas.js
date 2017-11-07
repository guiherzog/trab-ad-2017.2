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
		let queue1 = [];

		// primeiro freguês
		let arrival = Utils.getRandomExp(lambda);
		let executionStart = arrival;

		let serviceTime = Utils.getRandomExp(mi);

		let customer = new Customer(arrival, executionStart, serviceTime, 0, 0);
		queue1.push(customer);


		// fregueses depois do primeiro
		for(let i = 1; i < nCustomers; i++) {
			arrival += Utils.getRandomExp(lambda);
			executionStart = Math.max(arrival, queue1[i-1].executionEnd);

			// Verificar se tem alguem no servidor
				// Verificar se é da fila 1 ou fila 2
					// Se for da fila 2, remove e muda seus tempos.
					// Se for da fila 1, nao faz nada.
			// Modificar os tempos de todos da fila 1 que vao pra fila 2.
			// Modificar os tempos de todos da fila 2 pois nao terao prioridade.


			// verificar o que foi afetado na segunda fila com a chegada desse cara da primeira
			for(let j = 0; j < queue2.length; j++) {

				// se o fregues j da fila 2 chegou no sistema antes da minha execucao
				// e o da minha frente na fila 1 termina a execução antes de eu começar
				// (ou seja, terá um gap onde fregueses da fila 2 poderão executar)
				if(queue2[j].arrival < executionStart && queue1[i-1].executionEnd < executionStart) {

					// fregues da fila 2 vai iniciar assim que o último da 1 termina (antes do seguinte da 1 começar)
					queue2[j].executionStart.push(queue1[i-1].executionEnd);

					// quanto de tempo de servico ele (cara da fila 2) vai poder executar nesse gap
					// (
					//  tempo desde o inicio da executao desse cara da fila 2
					//  (que é o final da exec do último da fila 1) até o início da exec do novo da fila 1
					// )
					let gapTime = executionStart - queue2[j].executionStart[last];

					// se o residual (quanto falta) é menor que o gap time, ele vai terminar
					if(queue2[j].serviceTime <= gapTime) {
						queue2[j].serviceTime = 0;
						queue2[j].executionEnd.push(queue2[j].executionStart[last] + queue2[j].serviceTime[last]);
					}

					// senão, vai faltar um pouco ainda (subtraio o gap time do residual que ele tinha (serviceTime))
					else {
						queue2[j].serviceTime -= gapTime;
						queue2[j].executionEnd.push(executionStart);
					}
				}

				// não terá um gap
				else {
					break;
				}
			}

			serviceTime = Utils.getRandomExp(mi);

			// pessoas na fila com executionStart > arrival do atual;
			let Nq = 0;
			for(let j = i-1; j >= 0; j--) {
				let c = queue1[j];
				if(c.executionStart >= arrival) Nq++;
				else break;
			}

			// tem alguém que satisfaz executionStart <= arrival <= executionEnd
			let Ns = 0;
			for(let j = i-1; j >= 0; j--) {
				let c = queue1[j];

				if(arrival <= c.executionEnd && arrival > c.executionStart) {
					Ns++;
					break;
				}

				if(c.executionEnd < arrival)
					break;
			}

			//console.log("Nq = " + Nq + ", Ns = " + Ns);

			let customer = new Customer(arrival, executionStart, serviceTime, Nq, Ns);
			queue1.push(customer);
		}


		//console.log(queue1);

		let waitSum = 0;
		for(let i = 0; i < nCustomers; i++) waitSum += queue1[i].wait;
		let waitAvg = waitSum / nCustomers;

		let serviceSum = 0;
		for(let i = 0; i < nCustomers; i++) serviceSum += queue1[i].serviceTime;
		let serviceAvg = serviceSum / nCustomers;

		let timeAvg = waitAvg + serviceAvg;


		let nQueueSum = 0;
		for(let i = 0; i < nCustomers; i++) nQueueSum += queue1[i].Nq;
		let nQueueAvg = nQueueSum / nCustomers;

		let nServiceSum = 0;
		for(let i = 0; i < nCustomers; i++) nServiceSum += queue1[i].Ns;
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