const { QueueSystem } = require('./src/QueueSystem');

let QueueSystem1 = new QueueSystem();

// Roda a simulação com rho 0.2

function addFormListener(){
	$("#runForm").submit((e)=>{
		e.preventDefault();
		let rho = $("#rhoField").val();
		if (rho > 0){
			QueueSystem1.runSimulation(10, 1, rho); // nCustomers, nRounds, rho
		} else {
			renderNotification('top', 'center');
		}

	})
}

// Alerta o usuário caso ele insira um rho menor que zero.
function renderNotification(from, align){
	$.notify({
			icon: "memory",
			message: "A utilização precisa ser maior que ZERO."

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