const { QueueSystem } = require('./src/QueueSystem');

let QueueSystem1 = new QueueSystem();

// Roda a simulação com rho 0.2
QueueSystem1.runSimulation(2, 1, 0.4); // nCustomers, nRounds, rho
// // Roda a simulação com rho 0.4
// QueueSystem1.runSimulation(100, 10, 0.4);
// // Roda a simulação com rho 0.6
// QueueSystem1.runSimulation(100, 10, 0.6);
// // Roda a simulação com rho 0.8
// QueueSystem1.runSimulation(100, 10, 0.8);
// // Roda a simulação com rho 0.9
// QueueSystem1.runSimulation(100, 10, 0.9);