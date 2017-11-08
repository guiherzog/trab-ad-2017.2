const { Queue } = require('./Queue');
const { Customer } = require('./Customer');
const { Utils } = require('./Utils');
const { Event } = require('./Event');
const { EventType } = require('./EventType');

/* 
	Classe principal responsável por controlar todo o sistema.
*/
class QueueSystem {
	/* 
		Roda uma simulação com n fregueses, n vezes.
		Calculando o lambda e mi de modo a manter o rho definido no parametro.
	*/
	runSimulation(nCustomers, nRounds, rho){
		let lambda = rho/2;
		let mi = 1/2;
		let results = [];

		for(let i = 0; i < nRounds; i++) {
			let roundResult = this.runRound(nCustomers, lambda, mi);
			results.push(roundResult);
		}
	}

	/*
		Adiciona um evento na lista de eventos.
	*/
	addEvent(events, newEvent) {
		let newEventTime = newEvent.time;
		let pos = events.findIndex(e => e.time > newEventTime);
 		
 		// servidor vazio (events vazio ou newEvent será o último)
		if(pos == -1) return events.push(newEvent) - 1;
		
		events.splice(pos, 0, newEvent);
		return pos;
	}

	/* 
		Executa uma rodada da simulação com n fregueses.

		Teste com fila D/D/1:
			arrivalTime += 1;
			service1Time = 1;
			service2Time = 2;

		Fregues 1 começa a execução do serviço 2 no mesmo instante que o fregues 2 chega e é interrompido com zero segundos.

	*/
	runRound(nCustomers, lambda, mi) {

		let events = [];
		let arrivalTime = 0;

		for(let i = 1; i <= nCustomers; i++) {
			arrivalTime += Utils.getRandomExp(lambda);
			let service1Time = Utils.getRandomExp(mi);
			let service2Time = Utils.getRandomExp(mi); 

			console.log(`
Fregues ${i}:
	Tempo Chegada = ${arrivalTime},
	Serviço 1 = ${service1Time},
	Serviço 2 = ${service2Time}
			`);

			// Evento de chegada no sistema
			let arrival = new Event(arrivalTime, i, EventType.SYSTEM_ARRIVAL, 1);
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
	}
}

exports.QueueSystem = QueueSystem