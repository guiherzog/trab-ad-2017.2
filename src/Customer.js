const { Utils } = require('./Utils');

/*
	Fregues possui tempos de serviço aleatórios definidos por uma variável exponencial.
*/
class Customer {
	constructor(arrival, executionStart, serviceTime, Nq, Ns){
		this.arrival = arrival;
		this.executionStart = executionStart;
		this.serviceTime = serviceTime;
		this.executionEnd = executionStart + serviceTime;
		this.wait = executionStart - arrival;

		this.Nq = Nq;
		this.Ns = Ns;

		// TODO acertar nomes
	}
}

exports.Customer = Customer;