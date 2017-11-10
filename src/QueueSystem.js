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
		let mi = 1;
		let results = [];

		let startTime = new Date().getTime();
		for(let i = 0; i < nRounds; i++) {
			let roundResult = this.runRound(nCustomers, lambda, mi);
			results.push(roundResult);
		}
		let endTime = new Date().getTime();

		console.log(`Tempo total: ${(endTime -  startTime)/1000}`);
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
	*/
	runRound(nCustomers, lambda, mi) {

		let events = [];
		let Ns1 = [];
		let Ns2 = [];
		let Nq1 = [];
		let Nq2 = [];
		let W1 = [];
		let W2 = [];
		let X1 = [];
		let X2 = [];
		let arrivalTime = 0;

		let customerIndexStartsFrom = 1;

		for(let i = customerIndexStartsFrom; i <= nCustomers; i++) {
			arrivalTime += Utils.getRandomExp(lambda);
			let service1Time = Utils.getRandomExp(mi);
			let service2Time = Utils.getRandomExp(mi);

			// Adiciona o tempo de serviço 1 e 2 deste freguês.
			X1[i] = service1Time;
			X2[i] = service2Time;

// 			console.log(`
// Fregues ${i}:
// 	Tempo Chegada = ${arrivalTime},
// 	Serviço 1 = ${service1Time},
// 	Serviço 2 = ${service2Time}
// 			`);

			// Evento de chegada no sistema
			let arrival = new Event(arrivalTime, i, EventType.SYSTEM_ARRIVAL, 1);
			let arrivalEventPos = this.addEvent(events, arrival);

			// Inicio do servico 1 do freguês autal =
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

			// Espera na fila 1 = "inicio servico 1" - "chegou no sistema"
			W1[i] = service1Start - arrivalTime;

			let start1EventPos;

			// Tem servico 1 em andamento, vou adicionar logo depois de um fim de servico 1
			if(lastService1End > arrivalTime && lastService1EndPos > 0) {
				events.splice(lastService1EndPos+1, 0, start1);
				start1EventPos = lastService1EndPos+1;
			}

			// Não tem servico 1 em andamento, vou adicionar no arrival time do freguês atual
			else {
				start1EventPos = this.addEvent(events, start1);
			}

			// Como a fila 1 tem prioridade, devemos agora atualizar todos os eventos
			// da fila 2 (início e fim de serviço 2) que vem depois, somando um offset
			// ao tempo deles (esse offset será o tempo do serviço 1 do freguês atual)
			for(let j = start1EventPos+1; j < events.length; j++) {
				let event = events[j];
				event.time += service1Time; // offset será o tempo do serviço 1 do freguês atual

				// somar esse atraso no tempo de espera do cara na fila 2: 
				W2[event.customerId] += service1Time;
			}

			// Fim do servico 1 do freguês atual = inicio + o tempo de serviço 1
			let end1 = new Event(service1Start + service1Time, i, EventType.SERVICE_END, 1);
			// Se tinha serviço 1 em andamento
			if(lastService1End > arrivalTime && lastService1EndPos > 0) {
				events.splice(lastService1EndPos+2, 0, end1);
			}
			else
				this.addEvent(events, end1);

			/* 
				Checar se service1Start caiu no meio de um serviço 2 em execucao
				(está entre um inicio servico 2 e fim servico 2), vai ter interrupção

				(e o evento logo antes da chegada é início ou continuação de serviço 2)
			*/
			if(arrivalEventPos > 0 &&
			   (events[arrivalEventPos-1].type == EventType.SERVICE_START ||
			   events[arrivalEventPos-1].type == EventType.SERVICE_RESUME) &&
			   events[arrivalEventPos-1].priority == 2) {
				// Criar interrupcao e continuacao do serviço 2 no qual eu caí no meio

				let customerId = events[arrivalEventPos-1].customerId;
				
				let interruption = new Event(arrivalTime, customerId, EventType.SERVICE_INTERRUPTION, 2);

				// Adicionando evento da interrupção antes do evento de início do serviço 1 do cara que interrompeu
				events.splice(start1EventPos, 0, interruption);

				let resume = new Event(arrivalTime + service1Time, customerId, EventType.SERVICE_RESUME, 2);
				this.addEvent(events, resume);
			}

			// Colocar inicio e fim do serviço 2 do freguês atual no fim da lista de eventos
			let lastEventTime = events[events.length-1].time;
			let service2Start = lastEventTime;

			let start2 = new Event(service2Start, i, EventType.SERVICE_START, 2);
			this.addEvent(events, start2);
			let end2 = new Event(service2Start + service2Time, i, EventType.SERVICE_END, 2);
			this.addEvent(events, end2);

			// Tempo inical na fila 2: "inicio servico 2" - "chegou na fila 2"
			// ("chegou na fila 2" = "fim servico 1")
			let service1End = service1Start + service1Time;
			W2[i] = service2Start - service1End;

			Nq1[i] = 0;
			Ns2[i] = 0;
			Nq2[i] = 0;
			Ns1[i] = 0;

			for (let j = 0; j < arrivalEventPos; j++) {
				let ev = events[j];
				/* 
					Nq1 = Quantos chegaram antes dele -  quantos iniciaram serviço 1 antes dele.
				*/
				if (ev.type == EventType.SYSTEM_ARRIVAL)
					Nq1[i]++;
				else if (ev.type == EventType.SERVICE_START &&
						 ev.priority == 1)
					Nq1[i]--;

				/* 
					Nq2 = 
						Quantos chegaram na fila 2 (terminaram serviço 1 ou foram interrompidos)
						subtraídos de
						Quantos começaram o serviço 2 (inicio serviço 2 ou continuação serviço 2)
				*/
				// Chegou na fila 2 (= terminou serviço 1).
				if (ev.type === EventType.SERVICE_END && ev.priority === 1)
					Nq2[i]++;
				// Chegou na fila 2 por ter sido interrompido.
				else if (ev.type === EventType.SERVICE_INTERRUPTION && ev.priority === 2)
					Nq2[i]++;
				// Começou serviço 2 do inicio.
				else if (ev.type === EventType.SERVICE_START && ev.priority === 2)
					Nq2[i]--;
				// Recomeçou serviço 2 após interrupção.
				else if (ev.type === EventType.SERVICE_RESUME && ev.priority === 2)
					Nq2[i]--;

				/*
					 Ns1 = Quantos iniciaram o serviço 1 antes dele - Quantos terminaram o serviço 1 antes dele.
				*/
				if (ev.type == EventType.SERVICE_START && ev.priority == 1)
					Ns1[i]++;
				else if (ev.type == EventType.SERVICE_END && ev.priority == 1)
					Ns1[i]--;

				/*
					 Ns2 = Quantos iniciaram o serviço 2 antes dele - Quantos terminaram o serviço 2 antes dele.
				*/
				// Começou serviço 2 do inicio.
				if (ev.type === EventType.SERVICE_START && ev.priority === 2)
					Ns2[i]++;
				// Recomeçou serviço 2 após interrupção.
				else if (ev.type === EventType.SERVICE_RESUME && ev.priority === 2)
					Ns2[i]++;
				// Parou serviço por ter sido interrompido.
				else if (ev.type == EventType.SERVICE_INTERRUPTION && ev.priority == 2)
					Ns2[i]--;
				// Terminou o serviço 2.
				else if (ev.type == EventType.SERVICE_END && ev.priority == 2)
					Ns2[i]--;
			}

			if ((i & 0x1FF) == 0){
				console.log(i);
			}

		}
		// console.table(events);

		// console.log('Nq1 (número de pessoas esperando na fila 1):');
		// console.log(Nq1);
		// console.log('Nq2 (número de pessoas esperando na fila 2):');
		// console.log(Nq2);

		// console.log('Ns1 (número de pessoas em serviço 1):');
		// console.log(Ns1);
		// console.log('Ns2 (número de pessoas em serviço 2):');
		// console.log(Ns2);

		// console.log('W1 (tempo de espera na fila 1)');
		// console.log(W1);
		// console.log('W2 (tempo de espera na fila 2)');
		// console.log(W2);

		// console.log('X1 (tempo em execução do serviço 1)');
		// console.log(X1);
		// console.log('X2 (tempo em execução do serviço 2)');
		// console.log(X2);

		/*
		Length de um array em js não é o número de elementos, mas sim "maior índice + 1".

		Quando os elementos são adicionados sequencialmente a partir do índice 0, a length
		realmente será o número de elementos no array. Porém, quando começamos os índices em 1,
		e adicionadomos sequencialmente a partir daí, a length será "número de elementos" + 1.

		Para isso foi usado o customerIndexStartsFrom.
		*/

		let Nq1Avg = Nq1.reduce((a,b) => (a+b)) / (Nq1.length-customerIndexStartsFrom);
		let Nq2Avg = Nq2.reduce((a,b) => (a+b)) / (Nq2.length-customerIndexStartsFrom);
		let Ns1Avg = Ns1.reduce((a,b) => (a+b)) / (Ns1.length-customerIndexStartsFrom);
		let Ns2Avg = Ns2.reduce((a,b) => (a+b)) / (Ns2.length-customerIndexStartsFrom);
		let N1Avg = Nq1Avg + Ns1Avg;
		let N2Avg = Nq2Avg + Ns2Avg;

		let W1Avg = W1.reduce((a,b) => (a+b)) / (W1.length-customerIndexStartsFrom);
		let W2Avg = W2.reduce((a,b) => (a+b)) / (W2.length-customerIndexStartsFrom);
		let X1Avg = X1.reduce((a,b) => (a+b)) / (X1.length-customerIndexStartsFrom);
		let X2Avg = X2.reduce((a,b) => (a+b)) / (X2.length-customerIndexStartsFrom);
		let T1Avg = W1Avg + X1Avg;
		let T2Avg = W2Avg + X2Avg;

		console.log(`
Valores médios:

	Nq1 médio = ${Nq1Avg}
	Ns1 médio = ${Ns1Avg}
	N1  médio = ${N1Avg}

	Nq2 médio = ${Nq2Avg}
	Ns2 médio = ${Ns2Avg}
	N2  médio = ${N2Avg}

	W1 médio = ${W1Avg}
	X1 médio = ${X1Avg}
	T1 médio = ${T1Avg}

	W2 médio = ${W2Avg}
	X2 médio = ${X2Avg}
	T2 médio = ${T2Avg}
	`);
		this.renderEvents(events);
	}

	renderEvents(events){
		document.getElementById("eventsList").innerHTML = "";
		let tRows = ``;
		for (let i = 1; i <= events.length; i++) {
			if (!events[i])
				break;
			tRows +=`
				<tr>
					<td>${i}</td>
					<td>${events[i].time.toFixed(3)} </td>
					<td>${events[i].type}</td>
					<td>${events[i].customerId}</td>
					<td>${events[i].priority}</td>
				</tr>
			`;
			document.getElementById("eventsList").innerHTML = tRows;
		}
	}
}

exports.QueueSystem = QueueSystem