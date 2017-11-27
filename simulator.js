const { QueueSystem } = require('./src/QueueSystem');

let QueueSystem1 = new QueueSystem();

function addFormListener(){
	$("#runForm").submit((e)=>{
		e.preventDefault();
		// Valores defaults dos parametros
		let nCustomers = parseInt($("#nCustomersField").val()) || 10000;
		let nRounds = parseInt($("#nRoundsField").val()) || 1;
		let rho = parseFloat($("#rhoField").val()) || 0.4;
		if (nCustomers > 0 && nRounds > 0 && rho > 0){
			QueueSystem1.runSimulation(nCustomers, nRounds, rho);
		} else {
			renderNotification('top', 'center');
		}

	})
}

// Alerta o usuário caso ele deixe de preencher algum campo ou deixe-o menor que 0
function renderNotification(from, align){
	$.notify({
		icon: "memory",
		message: "Todos os campos são obrigatórios e precisam ser maiores que ZERO."
	},{
		type: 'danger',
		timer: 2000,
		placement: {
			from: from,
			align: align
		}
	});
}

addFormListener();

// // Roda a simulação com rho 0.4
// QueueSystem1.runSimulation(100, 10, 0.4);
// // Roda a simulação com rho 0.6
// QueueSystem1.runSimulation(100, 10, 0.6);
// // Roda a simulação com rho 0.8
// QueueSystem1.runSimulation(100, 10, 0.8);
// // Roda a simulação com rho 0.9
// QueueSystem1.runSimulation(100, 10, 0.9);