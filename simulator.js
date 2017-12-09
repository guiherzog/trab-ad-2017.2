const { QueueSystem } = require('./src/QueueSystem');

let QueueSystem1 = new QueueSystem();

// Método responsável por gerenciar o form e executar a simulação ao clicar em play.
function addFormListener(){
	$("#runForm").submit((e)=>{
		e.preventDefault();
		// Valores defaults dos parametros
		let nCustomers = parseInt($("#nCustomersField").val());
		let nTransient = parseInt($("#nTransient").val());
		let nRounds = parseInt($("#nRoundsField").val());
		let rho = parseFloat($("#rhoField").val());

		if($("#nTransient").val() === "") {
			     if(rho < 0.4) nTransient = 10000;
			else if(rho < 0.6) nTransient = 15000;
			else if(rho < 0.8) nTransient = 30000;
			else               nTransient = 50000;
		}


		// Erros
		if(nCustomers > 25000000) {
			setTimeout(()=>
				renderNotification('top', 'center', "O número de fregueses por rodada não pode ser maior do que 25 milhões."), 200);
		}

		else if(nTransient + nCustomers*nRounds > 70000000) {
			setTimeout(()=>
				renderNotification('top', 'center', "O Fator Mínimo (Periodo Transiente + Fregueses x Rodadas) não pode ser maior do que 70 milhões."), 200);
		}

		else if(nTransient < 0 || nCustomers <= 0 || nRounds <= 0 || rho <= 0) {
			renderNotification('top', 'center', "Todos os campos são obrigatórios e precisam ser maiores que ZERO.");
		}

		// Sem erro
		else {
			renderRunningNotification('top', 'center');
			setTimeout(()=>QueueSystem1.runSimulation(nTransient, nCustomers, nRounds, rho), 100)
		}



		if (nTransient + nCustomers*nRounds < 100)
		{
			setTimeout(()=>
				renderNotification('top', 'center', "O Fator Mínimo (Periodo Transiente + Fregueses x Rodadas) é muito pequeno, alguns valores não serão calculados corretamente."), 200);
		}

		if (nRounds == 1){
			setTimeout(()=>
				renderNotification('top', 'center', "Para calcular o IC é preciso no mínimo 2 rodadas. O IC não será calculado corretamente."), 200);
		}
	})
}

// Alerta o usuário que a simulação está sendo executada.
function renderRunningNotification(from, align){
	$.notify({
		icon: "play_arrow",
		message: "Executando simulação. Aguarde por favor..."
	},{
		type: 'success',
		timer: 100,
		animate: {
			enter: 'animated rollIn',
			exit: 'animated rollOut'
		},
		placement: {
			from: from,
			align: align
		}
	});
}

// Alerta o usuário caso ele deixe de preencher algum campo ou deixe-o menor que 0
function renderNotification(from, align, msg){
	$.notify({
		icon: "memory",
		message: msg,
	},{
		type: 'danger',
		timer: 100,
		placement: {
			from: from,
			align: align
		}
	});
}

addFormListener();

$("#nCustomersField").val("5000");
$("#nRoundsField").val("80");
$("#rhoField").val("0.9");