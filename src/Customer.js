const { Utils } = require('./Utils');

/*
	Fregues possui tempos de serviço aleatórios definidos por uma variável exponencial.
*/
class Customer {
	constructor(id, arrival1, service1Time, service2Time){
		this.id = id;
		this.arrival1 = arrival1;
		this.arrival2 = 0;
		this.X1 = service1Time;
		this.X2 = service2Time;
		this.remainingTime = this.X1;
		this.priority = 1;

		// TODO acertar nomes
	}
}

exports.Customer = Customer;