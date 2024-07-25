const readline = require("readline");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateArray(size) {
  const randomArray = new Array(size);
  for (let i = 0; i < size; i++) {
    randomArray[i] = Math.floor(Math.random() * 1000);
  }
  return randomArray;
}

function sequentialSum(array) {
  return array.reduce((acc, value) => acc + value, 0);
}

function parallelSum(array, numThreads) {
  return new Promise((resolve) => {
    let partialSums = new Array(numThreads).fill(0);
    let threadsFinished = 0;

    for (let i = 0; i < numThreads; i++) {
      const start = Math.floor((array.length / numThreads) * i);
      const end = Math.floor((array.length / numThreads) * (i + 1));

      const worker = new Worker(__filename, {
        workerData: array.slice(start, end),
      });

      worker.on("message", (partialSum) => {
        partialSums[i] = partialSum;
        threadsFinished++;

        if (threadsFinished === numThreads) {
          resolve(sequentialSum(partialSums));
        }
      });
    }
  });
}

if (isMainThread) {
  rl.question("Quantas threads você quer utilizar? ", (threadsInput) => {
    const numThreads = parseInt(threadsInput, 10);

    rl.question("Qual o tamanho do seu vetor? ", (vetorInput) => {
      const arraySize = parseInt(vetorInput, 10);
      rl.close();

      const randomArray = generateArray(arraySize);

      console.log(`Você escolheu usar ${numThreads} threads.`);
      console.log(`O tamanho do vetor será ${arraySize}.`);

      console.log("========================");

      console.time("Soma Normal");
      const sequentialResult = sequentialSum(randomArray);
      console.log(`Resultado soma: ${sequentialResult}`);
      console.timeEnd("Soma Normal");

      console.log("========================");

      console.time("Soma Threads");
      parallelSum(randomArray, numThreads).then((parallelResult) => {
        console.log(`Resultado Threads: ${parallelResult}`);
        console.timeEnd("Soma Threads");
      });
    });
  });
} else {
  const sum = sequentialSum(workerData);
  parentPort.postMessage(sum);
}
