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
		Roda uma simulação com n fregueses, m vezes.
		Calculando o lambda e mi de modo a manter o rho definido no parametro.
	*/
	runSimulation(nTransient, nCustomers, nRounds, rho){
		let lambda = rho/2;
		let mi = 1;
		document.getElementById("simTitle").innerHTML = 
			"Executando simulação...";

		let startTime = new Date().getTime();
		this.runRounds(nTransient, nCustomers, nRounds, lambda, mi);
		let endTime = new Date().getTime();

		document.getElementById("simTitle").innerHTML = 
			"Simulação finalizada em "+((endTime -  startTime)/1000)+" segundos";
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
	runRounds(nTransient, nCustomers, nRounds, lambda, mi) {
		// Inicialização de estruturas de dados para representar as filas e eventos
		let events = [];
		let queue1 = [];
		let queue2 = [];
		// Inicialização de variáveis p/ calcular esperanças
		let Ns1Avg = new Array(nRounds).fill(0);
		let Nq1Avg = new Array(nRounds).fill(0);
		let Ns2Avg = new Array(nRounds).fill(0);
		let Nq2Avg = new Array(nRounds).fill(0);
		let W1Avg = new Array(nRounds).fill(0);
		let W2Avg = new Array(nRounds).fill(0);
		let X1Avg = new Array(nRounds).fill(0);
		let X2Avg = new Array(nRounds).fill(0);

		// Índice -1 é um "round" reservado para a fase transiente
		Ns1Avg[-1] = 0;
		Nq1Avg[-1] = 0;
		Ns2Avg[-1] = 0;
		Nq2Avg[-1] = 0;
		W1Avg[-1] = 0;
		W2Avg[-1] = 0;
		X1Avg[-1] = 0;
		X2Avg[-1] = 0;

		let currentTime = 0; // Variável que representa o tempo atual da simulação.

		let customerIndexStartsFrom = 1; // Variável para representar os indíces a partir de 1. Objetivo estético.
		let nextCustomerId = -nTransient; // Variável que representa o próximo ID que deve ser usado na criação de um freguês. IDs menores que 0 representam o periodo transiente
		let nServiceEnd2 = 0; // Variável que representa quantos fregueses já saíram do sistema.
		let executingCustomer = null; // Variável que representa qual o freguês que está atualmente executando no servidor.
		
		// Listas com o valor da variável a cada x iterações, a ser passado para gerar o gráfico
		let ns1PerTime = [];
		let nq1PerTime = [];
		let w1PerTime  = [];
		let ns2PerTime = [];
		let nq2PerTime = [];
		let w2PerTime  = [];

		let nPoints = 200; // Quantos pontos serão coletados para o gráfico
		if(nCustomers + nTransient < nPoints)
			nPoints = nCustomers + nTransient;

		let currentNs1;
		let currentNq1;
		let currentW1;
		let currentNs2;
		let currentNq2;
		let currentW2;

		// Usar valores determinísticos no lugar dos gerados aleatoriamente
		let deterministic = false;

		// Definindo valores determinísticos
		Utils.setDeterministicArrivals([1, 2]);
		Utils.setDeterministicX1s([1, 10]);
		Utils.setDeterministicX2s([3, 2]);


		// Loop da simulação é executado até nCustomers terem saído do sistema
		while (nServiceEnd2 < nCustomers * nRounds) {
			// Gerando tempo percorrido até a próxima chegada no sistema
			let time;
			if(deterministic)
				time = Utils.getDeterministicArrival();
			else
				time = Utils.getRandomExp(lambda);


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

					let executingCustomerRound;

					// Período transiente
					if(executingCustomer.id < 0) 
						executingCustomerRound = -1;
					else 
						// Verificando qual é o round do consumidor que está atualmente executando para armazenar suas esperanças corretamente.
						executingCustomerRound = Math.floor(executingCustomer.id / nCustomers);

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
						currentW1 = ((currentTime - time) - executingCustomer.arrival1) - executingCustomer.X1;
						W1Avg[executingCustomerRound] += currentW1;
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
						currentW2 = ((currentTime - time) - executingCustomer.arrival2) - executingCustomer.X2;
						W2Avg[executingCustomerRound] += currentW2;
						queue2.shift(); // Shift() é uma função de array que remove seu primeiro elemento, e atualiza os índices de todos os elementos.
						// Apenas considerando fregueses que saíram e que não fazem parte do período transiente.
						if (executingCustomer.id >= 0)
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
				Consumidores continuam sendo criados mesmo após atingir o limite de consumidores para a rodada.
				Isto acontece para preservar a utilização da fila, já que se não criassemos consumidores após o limite, as filas começariam a esvaziar
				até o momento onde o último freguês da fila 2 executaria, sendo o único freguês em todo o sistema.
				Apesar de novos fregueses serem criados, eles não influenciam as métricas de Esperança, por não fazerem parte do número de consumidores esperado
				por rodada. Entretanto, a presença deles no sistema irá influenciar no cálculo da Esperança do tempo de espera da fila 2.
			*/

			let currentRound;

			// Período transiente
			if(nextCustomerId < 0) 
				currentRound = -1;
			else
				// Verificando qual é o round atual para salvar corretamente as esperanças obtidas na criação de um novo consumidor.
				currentRound = Math.floor(nextCustomerId / nCustomers);

			// Criação dos tempos de execução X1 e X2 para o próximo freguês
			let service1Time;
			let service2Time;

			if(deterministic)
				service1Time = Utils.getDeterministicX1();
			else
				service1Time = Utils.getRandomExp(mi);

			if(deterministic)
				service2Time = Utils.getDeterministicX2();
			else
				service2Time = Utils.getRandomExp(mi);

			// Ambos tempos precisam ser adicionados no cálculo da esperança de X1 e X2
			X1Avg[currentRound] += service1Time;
			X2Avg[currentRound] += service2Time;
			let customer = new Customer(nextCustomerId, currentTime, service1Time, service2Time);
			/*
				No momento que um freguês chega, é necessário verificar o estado de ambas filas para atualizar a Esperança de Nq1 e Nq2.
				Para este cálculo, usamos o tamanho das filas 1 e 2. Apesar de isso parecer certo num primeiro momento, o código desta simulação
				não remove um freguês de sua fila no momento em que ele passa a executar. Isso só acontece no instante em que ele termina seu tempo de execução
				para aquela fila. Por conta disso, é necessário diminuir o valor de Nq1/Nq2 em 1 se alguém daquela fila estiver executando.
				Este procedimento é executado um pouco mais abaixo.
			*/
			currentNq1 = queue1.length;
			Nq1Avg[currentRound] += currentNq1;
			currentNq2 = queue2.length;
			Nq2Avg[currentRound] += currentNq2;

			currentNs1 = currentNs2 = 0;

			// Freguês é adicionado na fila 1 (já que é a única fila com chegadas externas), e é criado um evento para sua chegada.
			queue1.push(customer);
			events.push(new Event(currentTime, customer.id + customerIndexStartsFrom, EventType.SYSTEM_ARRIVAL, 1));
			// Se não existe ninguém executando, o freguês que chegou vai diretamente ao servidor.
			if (executingCustomer == null){
				executingCustomer = customer;
			} else {
				// Se existe alguém da fila 1 executando, é necessário atualizar as Esperanças de Nq1 e Ns1.
				if (executingCustomer.priority == 1){
					currentNq1--;
					Nq1Avg[currentRound]--;
					currentNs1++;
					Ns1Avg[currentRound]++;
				} 
				// Se existe alguém da fila 2 executando, é necessário atualizar as Esperanças de Nq1 e Ns1.
				// Além disso, por conta de prioridade, o freguês que chegou no sistema toma o lugar do freguês da fila 2 que estava no servidor.
				else {
					executingCustomer = customer;
					currentNq2--;
					Nq2Avg[currentRound]--;
					currentNs2++;
					Ns2Avg[currentRound]++;
				}
			}
			nextCustomerId++; // Incrementando ID a ser utilizado na criação de fregueses

			/* 
				A cada <interval> iterações, adiciona as médias atuais nas listas.
			*/
			let interval = parseInt((nCustomers + nTransient) / nPoints, 10);

			if (nextCustomerId % interval === 0) {
				let totalId = (nextCustomerId + nTransient);

				let totalNs1 = Ns1Avg[-1] + Ns1Avg[0];
				let totalNq1 = Nq1Avg[-1] + Nq1Avg[0];
				let totalW1  = W1Avg[-1] + W1Avg[0];
				let totalNs2 = Ns2Avg[-1] + Ns2Avg[0];
				let totalNq2 = Nq2Avg[-1] + Nq2Avg[0];
				let totalW2  = W2Avg[-1] + W2Avg[0];

				ns1PerTime.push(totalNs1 / totalId);
				nq1PerTime.push(totalNq1 / totalId);
				 w1PerTime.push(totalW1  / totalId);
				ns2PerTime.push(totalNs2 / totalId);
				nq2PerTime.push(totalNq2 / totalId);
				 w2PerTime.push(totalW2  / totalId);
			}


		}

		let totalId = (nextCustomerId + nTransient);

		// Desenhando gráficos só ao final
		this.renderChart(nTransient, totalId, ns1PerTime, nPoints, '#chartNs1');
		this.renderChart(nTransient, totalId, nq1PerTime, nPoints, '#chartNq1');
		this.renderChart(nTransient, totalId, w1PerTime,  nPoints, '#chartW1');
		this.renderChart(nTransient, totalId, ns2PerTime, nPoints, '#chartNs2');
		this.renderChart(nTransient, totalId, nq2PerTime, nPoints, '#chartNq2');
		this.renderChart(nTransient, totalId, w2PerTime,  nPoints, '#chartW2');


		/*
			Com o final da execução da simulação, é hora de pegar todas as Esperanças coletadas e fazer suas médias.
			Para isso basta dividi-las pelo número de consumidores que passaram pelo sistema.
			Além disso, com os valores de Nq, Ns, W e X finalmente calculados para ambas filas, podemos calcular
			a Esperança do número de pessoas de cada fila, além da Esperança de tempo total de cada fila.
		*/

		// Inicialização das Esperanças de todas as rodadas juntas (média das amostras)
		let Ns1AvgSim = 0;
		let Nq1AvgSim = 0;
		let Ns2AvgSim = 0;
		let Nq2AvgSim = 0;
		let W1AvgSim = 0;
		let W2AvgSim = 0;
		let X1AvgSim = 0;
		let X2AvgSim = 0;

		document.getElementById("meanList").innerHTML = "";
		let meanRows = ``;

		let N1Avg = [];
		let T1Avg = [];
		let N2Avg = [];
		let T2Avg = [];

		// Exibição das Esperanças por rodada (media da rodada = amostra)
		for (var i = 0; i < nRounds; i++) {
			Nq1Avg[i] /= nCustomers;
			Ns1Avg[i] /= nCustomers;
			N1Avg[i] = Nq1Avg[i] + Ns1Avg[i];
			W1Avg[i] /= nCustomers;
			X1Avg[i] /= nCustomers;
			T1Avg[i] = W1Avg[i] + X1Avg[i];
			Nq2Avg[i] /= nCustomers;
			Ns2Avg[i] /= nCustomers;
			N2Avg[i] = Nq2Avg[i] + Ns2Avg[i];
			W2Avg[i] /= nCustomers;
			X2Avg[i] /= nCustomers;
			T2Avg[i] = W2Avg[i] + X2Avg[i];

			// Renderiza tabela de esperanças de cada rodada
			meanRows +=`
 				<tr>
 					<td>${i + 1}</td>
 					<td>${Nq1Avg[i].toFixed(5)}</td>
 					<td>${Ns1Avg[i].toFixed(5)}</td>
 					<td>${N1Avg[i].toFixed(5)}</td>

 					<td>${W1Avg[i].toFixed(5)}</td>
 					<td>${X1Avg[i].toFixed(5)}</td>
 					<td>${T1Avg[i].toFixed(5)}</td>

 					<td>${Nq2Avg[i].toFixed(5)}</td>
 					<td>${Ns2Avg[i].toFixed(5)}</td>
 					<td>${N2Avg[i].toFixed(5)}</td>

 					<td>${W2Avg[i].toFixed(5)}</td>
 					<td>${X2Avg[i].toFixed(5)}</td>
 					<td>${T2Avg[i].toFixed(5)}</td>
 				</tr>
			`;


			// console.log(`
			// 	Valores médios:

			// 		Nq1 médio = ${Nq1Avg[i]}
			// 		Ns1 médio = ${Ns1Avg[i]}
			// 		N1  médio = ${N1Avg}

			// 		Nq2 médio = ${Nq2Avg[i]}
			// 		Ns2 médio = ${Ns2Avg[i]}
			// 		N2  médio = ${N2Avg}

			// 		W1 médio = ${W1Avg[i]}
			// 		X1 médio = ${X1Avg[i]}
			// 		T1 médio = ${T1Avg}

			// 		W2 médio = ${W2Avg[i]}
			// 		X2 médio = ${X2Avg[i]}
			// 		T2 médio = ${T2Avg}
			// `);

			Ns1AvgSim += Ns1Avg[i];
			Nq1AvgSim += Nq1Avg[i];
			Ns2AvgSim += Ns2Avg[i];
			Nq2AvgSim += Nq2Avg[i];
			W1AvgSim += W1Avg[i];
			W2AvgSim += W2Avg[i];
			X1AvgSim += X1Avg[i];
			X2AvgSim += X2Avg[i];
		}

		// Cálculo e Exibição das Esperanças de todas as rodadas juntas (média das amostras)
		Nq1AvgSim /= nRounds;
		Ns1AvgSim /= nRounds;
		let N1AvgSim = Nq1AvgSim + Ns1AvgSim;
		W1AvgSim /= nRounds;
		X1AvgSim /= nRounds;
		let T1AvgSim = W1AvgSim + X1AvgSim;
		Nq2AvgSim /= nRounds;
		Ns2AvgSim /= nRounds;
		let N2AvgSim = Nq2AvgSim + Ns2AvgSim;
		W2AvgSim /= nRounds;
		X2AvgSim /= nRounds;
		let T2AvgSim = W2AvgSim + X2AvgSim;

		// Renderiza tabela de média das esperanças
		meanRows +=`
			<tr>
				<td><strong>Média</strong></td>
				
				<td><strong>${Nq1AvgSim.toFixed(5)}</strong></td>
				<td><strong>${Ns1AvgSim.toFixed(5)}</strong></td>
				<td><strong>${N1AvgSim.toFixed(5)}</strong></td>

				<td><strong>${W1AvgSim.toFixed(5)}</strong></td>
				<td><strong>${X1AvgSim.toFixed(5)}</strong></td>
				<td><strong>${T1AvgSim.toFixed(5)}</strong></td>


				<td><strong>${Nq2AvgSim.toFixed(5)}</strong></td>
				<td><strong>${Ns2AvgSim.toFixed(5)}</strong></td>
				<td><strong>${N2AvgSim.toFixed(5)}</strong></td>

				<td><strong>${W2AvgSim.toFixed(5)}</strong></td>
				<td><strong>${X2AvgSim.toFixed(5)}</strong></td>
				<td><strong>${T2AvgSim.toFixed(5)}</strong></td>
			</tr>
		`;

		// Renderiza tabela de esperanças.
		document.getElementById("meanList").innerHTML = meanRows;



		let Nq1Variance = 0;
		let Ns1Variance = 0;
		let N1Variance = 0;
		let W1Variance = 0;
		let X1Variance = 0;
		let T1Variance = 0;

		let Nq2Variance = 0;
		let Ns2Variance = 0;
		let N2Variance = 0;
		let W2Variance = 0;
		let X2Variance = 0;
		let T2Variance = 0;


		// Cálculo da variância das médias das rodadas (amostras)
		// Variancia = (1/(n-1)) * somatório, para todas as amostras, de (amostra - media das amostras)^2
		// (amostra = média da rodada)
		for (var i = 0; i < nRounds; i++) {
			Nq1Variance = Math.pow(Nq1Avg[i] - Nq1AvgSim, 2);
			Ns1Variance = Math.pow(Ns1Avg[i] - Ns1AvgSim, 2);
			N1Variance  = Math.pow(N1Avg[i] - N1AvgSim, 2);
			W1Variance  = Math.pow(W1Avg[i] - W1AvgSim, 2);
			X1Variance  = Math.pow(X1Avg[i] - X1AvgSim, 2);
			T1Variance  = Math.pow(T1Avg[i] - T1AvgSim, 2);

			Nq2Variance = Math.pow(Nq2Avg[i] - Nq2AvgSim, 2);
			Ns2Variance = Math.pow(Ns2Avg[i] - Ns2AvgSim, 2);
			N2Variance  = Math.pow(N2Avg[i] - N2AvgSim, 2);
			W2Variance  = Math.pow(W2Avg[i] - W2AvgSim, 2);
			X2Variance  = Math.pow(X2Avg[i] - X2AvgSim, 2);
			T2Variance  = Math.pow(T2Avg[i] - T2AvgSim, 2);

		}
		Nq1Variance /= nCustomers - 1;
		Ns1Variance /= nCustomers - 1;
		N1Variance  /= nCustomers - 1;
		W1Variance  /= nCustomers - 1;
		X1Variance  /= nCustomers - 1;
		T1Variance  /= nCustomers - 1;

		Nq2Variance /= nCustomers - 1;
		Ns2Variance /= nCustomers - 1;
		N2Variance  /= nCustomers - 1;
		W2Variance  /= nCustomers - 1;
		X2Variance  /= nCustomers - 1;
		T2Variance  /= nCustomers - 1;


		// Calculando o desvio padrão das médias das rodadas (amostras)
		let Nq1StdDev = Math.sqrt(Nq1Variance);
		let Ns1StdDev = Math.sqrt(Ns1Variance);
		let N1StdDev  = Math.sqrt(N1Variance);
		let W1StdDev  = Math.sqrt(W1Variance);
		let X1StdDev  = Math.sqrt(X1Variance);
		let T1StdDev  = Math.sqrt(T1Variance);

		let Nq2StdDev = Math.sqrt(Nq2Variance);
		let Ns2StdDev = Math.sqrt(Ns2Variance);
		let N2StdDev  = Math.sqrt(N2Variance);
		let W2StdDev  = Math.sqrt(W2Variance);
		let X2StdDev  = Math.sqrt(X2Variance);
		let T2StdDev  = Math.sqrt(T2Variance);


		/*
			Calculando intervalo de confiança de 95% usando a t-Student

			Para um grau de liberdade muito grande, a t-Student se aproxima da normal unitária
			P(Z <= 1.96) = 0.975 (1 - 0.05/2)
			(Z é N(0,1))
		*/
		let sqrtNRounds = Math.sqrt(nRounds);

		let Nq1CI = 1.96 * Nq1StdDev / sqrtNRounds;
		let Ns1CI = 1.96 * Ns1StdDev / sqrtNRounds;
		let N1CI  = 1.96 * N1StdDev  / sqrtNRounds;
		let W1CI  = 1.96 * W1StdDev  / sqrtNRounds;
		let X1CI  = 1.96 * X1StdDev  / sqrtNRounds;
		let T1CI  = 1.96 * T1StdDev  / sqrtNRounds;

		let Nq2CI = 1.96 * Nq2StdDev / sqrtNRounds;
		let Ns2CI = 1.96 * Ns2StdDev / sqrtNRounds;
		let N2CI  = 1.96 * N2StdDev  / sqrtNRounds;
		let W2CI  = 1.96 * W2StdDev  / sqrtNRounds;
		let X2CI  = 1.96 * X2StdDev  / sqrtNRounds;
		let T2CI  = 1.96 * T2StdDev  / sqrtNRounds;


		document.getElementById("ciNq1").innerHTML = Nq1AvgSim.toFixed(5) + " &plusmn; " + Nq1CI.toFixed(15);
		document.getElementById("ciNs1").innerHTML = Ns1AvgSim.toFixed(5) + " &plusmn; " + Ns1CI.toFixed(15);
		document.getElementById("ciN1").innerHTML  = N1AvgSim.toFixed(5)  + " &plusmn; " + N1CI.toFixed(15);
		document.getElementById("ciW1").innerHTML  = W1AvgSim.toFixed(5)  + " &plusmn; " + W1CI.toFixed(15);
		document.getElementById("ciX1").innerHTML  = X1AvgSim.toFixed(5)  + " &plusmn; " + X1CI.toFixed(15);
		document.getElementById("ciT1").innerHTML  = T1AvgSim.toFixed(5)  + " &plusmn; " + T1CI.toFixed(15);

		document.getElementById("ciNq2").innerHTML = Nq2AvgSim.toFixed(5) + " &plusmn; " + Nq2CI.toFixed(15);
		document.getElementById("ciNs2").innerHTML = Ns2AvgSim.toFixed(5) + " &plusmn; " + Ns2CI.toFixed(15);
		document.getElementById("ciN2").innerHTML  = N2AvgSim.toFixed(5)  + " &plusmn; " + N2CI.toFixed(15);
		document.getElementById("ciW2").innerHTML  = W2AvgSim.toFixed(5)  + " &plusmn; " + W2CI.toFixed(15);
		document.getElementById("ciX2").innerHTML  = X2AvgSim.toFixed(5)  + " &plusmn; " + X2CI.toFixed(15);
		document.getElementById("ciT2").innerHTML  = T2AvgSim.toFixed(5)  + " &plusmn; " + T2CI.toFixed(15);



		// console.log(`
		// 	Valores médios gerais da Simulação:

		// 		Nq1 médio = ${Nq1AvgSim}
		// 		Ns1 médio = ${Ns1AvgSim}
		// 		N1  médio = ${N1AvgSim}

		// 		Nq2 médio = ${Nq2AvgSim}
		// 		Ns2 médio = ${Ns2AvgSim}
		// 		N2  médio = ${N2AvgSim}

		// 		W1 médio = ${W1AvgSim}
		// 		X1 médio = ${X1AvgSim}
		// 		T1 médio = ${T1AvgSim}

		// 		W2 médio = ${W2AvgSim}
		// 		X2 médio = ${X2AvgSim}
		// 		T2 médio = ${T2AvgSim}
		// `);

	}


	//this.renderChart(nTransient, totalId, w2PerTime, '#chartW2');

	// Método que renderiza um gráfico em função do mundo de fregueses.
	/*
		nTransient - número de pessoas na fase transiente
		nTotal - número total de pessoas, incluindo fase transiente
		dataPerTime - dados coletados a cada <intervalo> iterações
		chartId - id do elemento onde será desenhado o gráfico
	*/
	renderChart(nTransient, nTotal, dataPerTime, nPoints, chartId){

		let labelArray = [];
		let interval = parseInt(nTotal / nPoints, 10); // De quantos em quantos clientes os dados foram coletados
		for (let i = 0; i < nPoints; i++) {
			labelArray[i] = i*interval;
		}

		const transientValues = dataPerTime.slice(0, nTransient/interval + 1);

		const dataRhoChart = {
				labels: labelArray,
				series: [dataPerTime, transientValues], 
		};

		const optionsRhoChart = {
			
			axisX: {
				labelInterpolationFnc: function skipLabels(value, index) {
					return (index % (nPoints/10)) === 0 ? value : null;
				}
			},
			axisY: {
				low: 0,
			},
			lineSmooth: Chartist.Interpolation.cardinal({
				tension: 0
			}),
			height: 200,
			chartPadding: { top: 30, right: 5, bottom: 0, left: 0},
			showPoint: false,
		};

		let rhoChart = new Chartist.Line(chartId, dataRhoChart, optionsRhoChart);
	}
}

exports.QueueSystem = QueueSystem