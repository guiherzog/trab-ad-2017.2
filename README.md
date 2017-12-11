# Trabalho de Avaliação de Desempenho 2017.2

Neste trabalho, foi desenvolvido um simulador de um sistema no qual duas filas disputam um servidor, e uma delas tem prioridade preemptiva sobre a outra.

A fila 1 tem chegadas segundo um processo Poisson com taxa λ. Após o primeiro serviço, os fregueses vão para a fila 2, com menos prioridade, onde serão servidos pela segunda vez. Depois desse segundo serviço, vão embora. 

Não chegam fregueses na fila 2. A fila 1 tem prioridade sobre a fila 2, demodo que um serviço em andamento na fila 2 pode ser interrompido por uma chegada na fila 1. As filas operam no modo FCFS (First Come FirstServed).

**p.s**: If you want this project in English, send me a message and I will help you to translate it. All variables are in English but all comments are in Portuguese. 