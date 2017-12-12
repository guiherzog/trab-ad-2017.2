const { QueueSystem } = require('./src/QueueSystem');
let QueueSystem1 = new QueueSystem();

// Método responsável por gerenciar os parâmetros e executar a simulação ao clicar em play.
function addFormListener(){
	$("#runForm").submit((e)=>{
		e.preventDefault();

		// Valores defaults dos parâmetros
		let nCustomers = parseInt($("#nCustomersField").val());
		let nTransient = parseInt($("#nTransient").val());
		let nRounds = parseInt($("#nRoundsField").val());
		let rho = parseFloat($("#rhoField").val());

		if($("#nTransient").val() === "") {
			     if(rho <= 0.4) nTransient = 10000;
			else if(rho <= 0.6) nTransient = 15000;
			else if(rho <= 0.8) nTransient = 20000;
			else                nTransient = 40000;
		}

		// Verificadores de erros ou warnings.
		if(nCustomers > 25000000) {
			setTimeout(()=>
				renderNotification('top', 'center', "O número de fregueses por rodada não pode ser maior do que 25 milhões."), 200);
		}
		// Se total de fregueses ultrapassa 70 milhões, nao rodar a aplicação
		else if(nTransient + nCustomers*nRounds > 70000000) {
			setTimeout(()=>
				renderNotification('top', 'center', "O Fator Mínimo (Periodo Transiente + Fregueses x Rodadas) não pode ser maior do que 70 milhões."), 200);
		}

		// Se algum parâmetro for menor que zero, exibe alerta e não roda simulação.
		else if(nTransient < 0 || nCustomers <= 0 || nRounds <= 0 || rho <= 0) {
			renderNotification('top', 'center', "Todos os campos são obrigatórios e precisam ser maiores que ZERO.");
		}

		// Caso nenhum erro aconteça roda normalmente.
		else {
			renderRunningNotification('top', 'center');
			setTimeout(()=>QueueSystem1.runSimulation(nTransient, nCustomers, nRounds, rho), 100)
		}

		// Exibe Warning se tiver poucos fregueses no total.
		if (nTransient + nCustomers*nRounds < 100)
		{
			setTimeout(()=>
				renderNotification('top', 'center', "O Fator Mínimo (Periodo Transiente + Fregueses x Rodadas) é muito pequeno, alguns valores não serão calculados corretamente."), 200);
		}

		// Se tiver apenas um round avisa que não vai calcular o IC.
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
// Define os parâmetros iniciais.
$("#nCustomersField").val("65");
$("#nRoundsField").val("3071");
$("#rhoField").val("0.4");