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


		// Inicialização de estruturas de dados para representar as filas e eventos
		let events = [];
		let queue1 = [];
		let queue2 = [];
		// Inicialização de variáveis p/ calcular esperanças
		let Ns1Avg = 0;
		let Ns2Avg = 0;
		let Nq1Avg = 0;
		let Nq2Avg = 0;
		let W1Avg = 0;
		let W2Avg = 0;
		let X1Avg = 0;
		let X2Avg = 0;
		let currentTime = 0; // Variável que representa o tempo atual da simulação.

		let customerIndexStartsFrom = 1; // Variável para representar os indíces a partir de 1. Objetivo estético.
		let nextCustomerId = 0; // Variável que representa o próximo ID que deve ser usado na criação de um freguês.
		let nServiceEnd2 = 0; // Variável que representa quantos fregueses já saíram do sistema.
		let executingCustomer = null; // Variável que representa qual o freguês que está atualmente executando no servidor.
		let rhoQueue1PerTime = []; // Lista com rho a cada algumas iterações.

		// Loop da simulação é executado até nCustomers terem saído do sistema
		while (nServiceEnd2 < nCustomers) {
			// Gerando tempo percorrido até a próxima chegada no sistema
			let time = Utils.getRandomExp(lambda);
			// Após gerar este tempo, o mesmo é adicionado ao tempo total da simulação
			currentTime += time;
			/*
				Loop que representa todas as ações que acontecem no sistema até a próxima chegada.
				Dentro do loop, fregueses são servidos respeitando suas prioridades e ordem na fila.
				O loop dura até o tempo a ser percorrido esgotar, ou não ter mais ninguém a ser servido até a próxima chegada.
			*/
			while (time > 0 && executingCustomer != null){
				// Verifica se o freguês que está atualmente no servidor conseguirá terminar de executar com o tempo restante antes da próxima chegada
				if (executingCustomer.remainingTime <= time){
					// Neste caso, é necessário diminuir o tempo restante antes da próxima chegada em uma quantidade igual ao tempo de execução restante do freguês
					time -= executingCustomer.remainingTime;
					executingCustomer.remainingTime = 0;
					// Criação de evento de fim de serviço
					events.push(new Event(currentTime - time, executingCustomer.id + customerIndexStartsFrom, EventType.SERVICE_END, executingCustomer.priority));
					/*
						Se o freguês que acabou de executar era da fila 1, é necessário atualiza-lo para ir para a fila 2.
						Antes de atualiza-lo, a Esperança do tempo de espera da fila 1 é atualizada, e o freguês é removido da fila 1.
						Para isso, sua prioridade, tempo de chegada na fila 2 e tempo restante de execução são atualizados.
						Após isso, ele é adicionado na fila 2, e um evento de chegada na fila 2 é criado.
					*/
					if (executingCustomer.priority == 1){
						/*
							O valor a ser adicionado na Esperança de W1 é igual a T1 - X1.
							Para isso, utilizamos (currentTime - time), que representa o momento de fim de serviço,
							que é diminuído do momento de chegada do freguês na fila 1 (que é o momento de chegada no sistema).
						*/
						W1Avg += ((currentTime - time) - executingCustomer.arrival1) - executingCustomer.X1;
						queue1.shift(); // Shift() é uma função de array que remove seu primeiro elemento, e atualiza os índices de todos os elementos.
						executingCustomer.priority = 2;
						executingCustomer.arrival2 = currentTime - time;
						executingCustomer.remainingTime = executingCustomer.X2;
						queue2.push(executingCustomer);
						events.push(new Event(currentTime - time, executingCustomer.id + customerIndexStartsFrom, EventType.SYSTEM_ARRIVAL, 2));
					}
					/*
						No caso onde o freguês que terminou execução era da fila 2, o procedimento é mais simples,
						já que ele sairá do sistema sem passar por nenhuma outra fila.
						Só precisamos atualizar a Esperança de W2, remover o freguês da fila 2
						e atualizar o número de fregueses que saíram do sistema.
					*/
					else {
						W2Avg += ((currentTime - time) - executingCustomer.arrival2) - executingCustomer.X2;
						queue2.shift(); // Shift() é uma função de array que remove seu primeiro elemento, e atualiza os índices de todos os elementos.
						nServiceEnd2++;
					}
					/*
						Após terminar a execução do freguês que estava no servidor, precisamos colocar o próximo freguês lá.
						Respeitando a prioridade que existe entre as filas, um freguês da fila 2 só será colocado no servidor se a fila 1 estiver vazia.
						Se não existir mais ninguém em ambas filas para ser executado, a variável de controle recebe null.
					*/
					if (queue1.length > 0)
						executingCustomer = queue1[0];
					else
						if (queue2.length > 0)
							executingCustomer = queue2[0];
						else
							executingCustomer = null;
				}
				// No caso onde o freguês dentro do servidor não irá terminar no tempo restante antes da próxima chegada, seu tempo é reduzido pelo tempo existente.
				// Após isso, o tempo restante antes da próxima chegada é atualizado em sua variável para 0.
				else {
					executingCustomer.remainingTime -= time;
					time = 0;
				}
			}
			/*
				Após a simulação ser atualizada até o momento da chegada de um novo freguês, primeiramente é necessário verificar se ainda é possível cria-lo.
				Nesta simulação, um freguês novo só entra no sistema se o próximo ID a ser criado for menor que o número de consumidores recebidos de entrada.
				Mesmo no caso onde nenhum freguês possa ser criado por ter chegado ao limite, a simulação continua executando em taxa baseada na chegada.
			*/
			if (nextCustomerId < nCustomers){
				// Criação dos tempos de execução X1 e X2 para o próximo freguês
				let service1Time = Utils.getRandomExp(mi);
				let service2Time = Utils.getRandomExp(mi);
				// Ambos tempos precisam ser adicionados no cálculo da esperança de X1 e X2
				X1Avg += service1Time;
				X2Avg += service2Time;
				let customer = new Customer(nextCustomerId, currentTime, service1Time, service2Time);
				/*
					No momento que um freguês chega, é necessário verificar o estado de ambas filas para atualizar a Esperança de Nq1 e Nq2.
					Para este cálculo, usamos o tamanho das filas 1 e 2. Apesar de isso parecer certo num primeiro momento, o código desta simulação
					não remove um freguês de sua fila no momento em que ele passa a executar. Isso só acontece no instante em que ele termina seu tempo de execução
					para aquela fila. Por conta disso, é necessário diminuir o valor de Nq1/Nq2 em 1 se alguém daquela fila estiver executando.
					Este procedimento é um pouco mais abaixo.
				*/
				Nq1Avg += queue1.length;
				Nq2Avg += queue2.length;
				// Freguês é adicionado na fila 1 (já que é a única fila com chegadas externas), e é criado um evento para sua chegada.
				queue1.push(customer);
				events.push(new Event(currentTime, customer.id + customerIndexStartsFrom, EventType.SYSTEM_ARRIVAL, 1));
				// Se não existe ninguém executando, o freguês que chegou vai diretamente ao servidor.
				if (executingCustomer == null){
					executingCustomer = customer;
				} else {
					// Se existe alguém da fila 1 executando, é necessário atualizar as Esperanças de Nq1 e Ns1.
					if (executingCustomer.priority == 1){
						Nq1Avg--;
						Ns1Avg++;
					} 
					// Se existe alguém da fila 2 executando, é necessário atualizar as Esperanças de Nq1 e Ns1.
					// Além disso, por conta de prioridade, o freguês que chegou no sistema toma o lugar do freguês da fila 2 que estava no servidor.
					else {
						executingCustomer = customer;
						Nq2Avg--;
						Ns2Avg++;
					}
				}
				nextCustomerId++; // Incrementando ID a ser utilizado na criação de fregueses
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

		/*
			Com o final da execução da simulação, é hora de pegar todas as Esperanças coletadas e fazer suas médias.
			Para isso basta dividi-las pelo número de consumidores que passaram pelo sistema.
			Além disso, com os valores de Nq, Ns, W e X finalmente calculados para ambas filas, podemos calcular
			a Esperança do número de pessoas de cada fila, além da Esperança de tempo total de cada fila.
		*/

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
		if (nCustomers <= 100)
			this.renderEvents(events);
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