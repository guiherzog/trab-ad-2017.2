const { Utils } = require('./Utils');

/*
	Fregues possui tempos de serviço aleatórios definidos por uma variável exponencial.
*/
class Customer {
	constructor(){
		this.serviceRate = Utils.getServiceRate();
	}
}

exports.Customer = Customer;