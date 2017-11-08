const { Queue } = require('./Queue');
const { Customer } = require('./Customer');
const { Utils } = require('./Utils');
const { Event } = require('./Event');
const { EventType } = require('./EventType');

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
			//console.log(roundResult);
		}

		

	}


	addEvent(events, newEvent) {
		let newEventTime = newEvent.time;
		let pos = events.findIndex(function(e) { return e.time > newEventTime });
 		
 		// servidor vazio (events vazio ou newEvent será o último)
		if(pos == -1) return events.push(newEvent) - 1;
		
		events.splice(pos, 0, newEvent);
		return pos;
	}

	runRound(nCustomers, lambda, mi) {

		let events = [];

		let arrivalTime = 0;

		for(let i = 0; i < nCustomers; i++) {
			arrivalTime += Utils.getRandomExp(lambda);
			let service1Time = Utils.getRandomExp(mi);
			let service2Time = Utils.getRandomExp(mi); 

			console.log("arrivalTime = " + arrivalTime + ", s1time = " + service1Time + ", s2time = " + service2Time);



			// evento de chegada no sistema - sem mistério
			let arrival = new Event(arrivalTime, i, EventType.SYSTEM_ARRIVAL, 1);
			console.log(arrival);
			let arrivalEventPos = this.addEvent(events, arrival);


			// inicio do servico 1 do freguês autal =
			// max(arrivalTime atual, último fim de serviço 1 da lista de eventos)
			let lastService1End = 0;
			let lastService1EndPos = -1;
			for(let j = events.length-1; j >= 0; j--) {
				if(events[j].type == EventType.SERVICE_END && events[j].priority == 1) {
					lastService1End = events[j].time;
					lastService1EndPos = j;
					break;
				}
			}
			let service1Start = Math.max(arrivalTime, lastService1End);
			let start1 = new Event(service1Start, i, EventType.SERVICE_START, 1);

			let start1EventPos;

			// tem servico 1 em andamento, vou adicionar logo depois de um fim de servico 1
			if(lastService1End > arrivalTime && lastService1EndPos > 0) {
				events.splice(lastService1EndPos+1, 0, start1);
				start1EventPos = lastService1EndPos+1;
			}

			// não tem servico 1 em andamento, vou adicionar no arrival time do freguês atual
			else {
				start1EventPos = this.addEvent(events, start1);
			}


			// como a fila 1 tem prioridade, devemos agora atualizar todos os eventos
			// da fila 2 (início e fim de serviço 2) que vem depois, somando um offset
			// ao tempo deles (esse offset será o tempo do serviço 1 do freguês atual)
			for(let j = start1EventPos+1; j < events.length; j++) {
				let event = events[j];
				event.time += service1Time; // offset será o tempo do serviço 1 do freguês atual
			}


			// fim do servico 1 do freguês autal = inicio + o tempo de serviço 1
			let end1 = new Event(service1Start + service1Time, i, EventType.SERVICE_END, 1);
			// se tinha serviço 1 em andamento
			if(lastService1End > arrivalTime && lastService1EndPos > 0) {
				events.splice(lastService1EndPos+2, 0, end1);
			}
			else
				this.addEvent(events, end1);


			// checar se service1Start caiu no meio de um serviço 2 em execucao
			// (está entre um inicio servico 2 e fim servico 2)
			// o evento logo antes da chegada é início de serviço 2
			if(arrivalEventPos > 0 &&
			   events[arrivalEventPos-1].type == EventType.SERVICE_START &&
			   events[arrivalEventPos-1].priority == 2) {
				// criar interrupcao e continuacao do serviço 2 no qual eu caí no meio

				let customerId = events[arrivalEventPos-1].customerId;
				
				let interruption = new Event(arrivalTime, customerId, EventType.SERVICE_INTERRUPTION, 2);
				//this.addEvent(events, interruption);
				// adicionando evento da interrupção antes do evento de início do serviço 1 do cara que interrompeu
				events.splice(start1EventPos, 0, interruption);

				let resume = new Event(arrivalTime + service1Time, customerId, EventType.SERVICE_RESUME, 2);
				this.addEvent(events, resume);
			}


			// colocar inicio e fim do serviço 2 do freguês atual no fim da lista de eventos
			let lastEventTime = events[events.length-1].time;
			let start2 = new Event(lastEventTime, i, EventType.SERVICE_START, 2);
			this.addEvent(events, start2);
			let end2 = new Event(lastEventTime + service2Time, i, EventType.SERVICE_END, 2);
			this.addEvent(events, end2);


			// TODO calcular Nq, Ns, N, etc, desse novo freguês

		}


		console.table(events);

		
/*
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
*/
	}
}

exports.QueueSystem = QueueSystem