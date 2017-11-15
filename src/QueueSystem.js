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
		let queue1 = [];
		let queue2 = [];
		let Ns1Avg = 0;
		let Ns2Avg = 0;
		let Nq1Avg = 0;
		let Nq2Avg = 0;
		let W1Avg = 0;
		let W2Avg = 0;
		let X1Avg = 0;
		let X2Avg = 0;
		let currentTime = 0;

		let customerIndexStartsFrom = 1;
		let nextCustomerId = 0;
		let nServiceEnd2 = 0;
		let executingCustomer = null;
		// Lista com rho a cada algumas iterações.
		let rhoQueue1PerTime = [];

		while (nServiceEnd2 < nCustomers) {
			let time = Utils.getRandomExp(lambda);
			currentTime += time;
			while (time > 0 && executingCustomer != null){
				if (executingCustomer.remainingTime <= time){
					time -= executingCustomer.remainingTime;
					executingCustomer.remainingTime = 0;
					events.push(new Event(currentTime - time, executingCustomer.id + customerIndexStartsFrom, EventType.SERVICE_END, executingCustomer.priority));
					if (executingCustomer.priority == 1){
						W1Avg += ((currentTime - time) - executingCustomer.arrival1) - executingCustomer.X1;
						queue1.shift();
						executingCustomer.priority = 2;
						executingCustomer.arrival2 = currentTime - time;
						executingCustomer.remainingTime = executingCustomer.X2;
						Nq2Avg += queue2.length;
						queue2.push(executingCustomer);
						events.push(new Event(currentTime - time, executingCustomer.id + customerIndexStartsFrom, EventType.SYSTEM_ARRIVAL, 2));
					}
					else {
						W2Avg += ((currentTime - time) - executingCustomer.arrival2) - executingCustomer.X2;
						queue2.shift();
						nServiceEnd2++;
					}
					if (queue1.length > 0)
						executingCustomer = queue1[0];
					else
						if (queue2.length > 0)
							executingCustomer = queue2[0];
						else
							executingCustomer = null;
				} else {
					executingCustomer.remainingTime -= time;
					time = 0;
				}
			}

			if (nextCustomerId < nCustomers){
				let service1Time = Utils.getRandomExp(mi);
				let service2Time = Utils.getRandomExp(mi);
				// Adiciona o tempo de serviço 1 e 2 deste freguês.
				X1Avg += service1Time;
				X2Avg += service2Time;
				let customer = new Customer(nextCustomerId, currentTime, service1Time, service2Time);
				Nq1Avg += queue1.length;
				queue1.push(customer);
				events.push(new Event(currentTime, customer.id + customerIndexStartsFrom, EventType.SYSTEM_ARRIVAL, 1));
				if (executingCustomer == null || executingCustomer.priority == 2)
					executingCustomer= customer;
				else {
					Nq1Avg--;
					Ns1Avg++;
				}
				nextCustomerId++;
			}

			/* 
				A cada 100 iterações, adiciona o rho atual na lista e renderiza o chart.
				Não tá otimizado ainda.
			*/
			if (nextCustomerId % 100 === 0) {
				rhoQueue1PerTime.push(Ns1Avg/nextCustomerId);
				this.renderRhoChart(nextCustomerId/100, rhoQueue1PerTime);
			}
		}

		Nq1Avg /= nCustomers;
		Ns1Avg /= nCustomers;
		let N1Avg = Nq1Avg + Ns1Avg;
		W1Avg /= nCustomers;
		X1Avg /= nCustomers;
		let T1Avg = W1Avg + X1Avg;
		Nq2Avg /= nCustomers;
		Ns2Avg /= nCustomers;
		let N2Avg = Nq2Avg + Ns2Avg;
		W2Avg /= nCustomers;
		X2Avg /= nCustomers;
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

		// Não dá pra renderizar a lista de eventos para mais de 100 fregueses.
		// this.renderEvents(events);
	}

	renderEvents(events){
		document.getElementById("eventsList").innerHTML = "";
		let tRows = ``;
		for (let i = 0; i <= events.length; i++) {
			if (!events[i])
				break;
			tRows +=`
				<tr>
					<td>${i + 1}</td>
					<td>${events[i].time.toFixed(3)} </td>
					<td>${events[i].type}</td>
					<td>${events[i].customerId}</td>
					<td>${events[i].priority}</td>
				</tr>
			`;
			document.getElementById("eventsList").innerHTML = tRows;
		}
	}

	// Método que renderiza o gráfico do rho em função do mundo de fregueses.
	renderRhoChart(nCustomers, rhoQueue1PerTime){
		let labelArray = [nCustomers];
		for (var i = 1; i <= nCustomers; i++) {
			labelArray[i-1] = i*100;
		};

		const dataRhoChart = {
				labels: labelArray,
				series: [rhoQueue1PerTime]
		};

		const optionsRhoChart = {
			axisX: {
				labelInterpolationFnc: function skipLabels(value, index) {
					return index % 10  === 0 ? value : null;
				}
			},
			lineSmooth: Chartist.Interpolation.cardinal({
				tension: 0
			}),
			height: 160,
			chartPadding: { top: 30, right: 5, bottom: 0, left: 0},
		}

		let rhoChart = new Chartist.Line('#rhoChart', dataRhoChart, optionsRhoChart);
	}
}

exports.QueueSystem = QueueSystem