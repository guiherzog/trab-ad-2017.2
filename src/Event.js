/* 
	Um evento, que pode ser chegada, iníco de serviço, etc.
	O evento tem os seguintes parâmetros:
	 - Hora
	 - Número do freguês
	 - Tipo de evento:
		- chegou no sistema (= chegada fila 1)
		- inicio servico
		- fim servico 
			- se for da fila 1, indica a chegada na fila 2
			- se for da fila 2, indica a saída do sistema
	- Prioridade

*/
class Event {
	constructor(time, customerId, type, priority){
		this.time = time;
		this.customerId = customerId;
		this.type = type;
		this.priority = priority;
	}
}

exports.Event = Event;