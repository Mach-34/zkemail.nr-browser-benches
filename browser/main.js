// import circuit from '../circuit/target/circuit.json';
import circuit from '../circuit/target/noir_zkemail_benchmarks.json';
import {
  BarretenbergBackend,
  UltraHonkBackend,
} from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";

const noir = new Noir(circuit);

const display = (container, msg, elementToRemove) => {
  const c = document.getElementById(container);
  if (elementToRemove) {
    c.removeChild(elementToRemove);
  }
  const p = document.createElement('p');
  p.textContent = msg;
  c.appendChild(p);
  return p;
};

const calcAvg = (aggTime, iterations) => {
  return {
    proofGenerationTime: aggTime.proofGenerationTime / iterations,
    proofVerificationTime: aggTime.proofVerificationTime / iterations,
    totalTime: aggTime.totalTime / iterations,
    witnessGenerationTime: aggTime.witnessGenerationTime / iterations,
  };
};

const prove = async (backend, inputs) => {

  const start = new Date().getTime() / 1000;
  console.log("executing witness")
  const { witness } = await noir.execute(inputs);
  const postWitnessGenerationTime = new Date().getTime() / 1000;
  console.log("generating proof")
  const proof = await backend.generateProof(witness);
  const postProofGenerationTime = new Date().getTime() / 1000;
  // await backend.verifyProof(proof);
  const postVerifyTime = new Date().getTime() / 1000;
  return {
    proofGenerationTime: postProofGenerationTime - postWitnessGenerationTime,
    proofVerificationTime: 0,
    totalTime: postProofGenerationTime - start,
    witnessGenerationTime: postWitnessGenerationTime - start,
  };
};

const proveBackend = async (proveWith) => {
  const iterations = 5;

  const threads = window.navigator.hardwareConcurrency;
  console.log(`Using ${threads} threads`);
  const backend = proveWith === 'honk'
    ? new UltraHonkBackend(circuit)
    : new BarretenbergBackend(circuit, { threads });

  const totalTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };

  const email = new Uint8Array(await (await fetch("./email-good-large.eml")).arrayBuffer());
  const inputs = await generateEmailVerifierInputs(email, {
    maxHeadersLength: 512,
    maxBodyLength: 1024
  });
  // clear logs
  const logs = document.getElementById('logs');
  logs.innerHTML = '';

  let prevDisplay = display(
    'logs',
    `Benching ${proveWith} for ${iterations} iteration${
      iterations === 1 ? '' : 's'
    }... ⏳\n\n`
  );
  // do cold start proof
  const coldRes = await prove(backend, inputs);
  display('logs', `Cold start witness generation time: ${coldRes.witnessGenerationTime}s ✅`);
  display('logs', `Cold start proof generation time: ${coldRes.proofGenerationTime}s ✅`);
  display('logs', `Cold start total time: ${coldRes.totalTime}s ✅`);

  for (let i = 1; i < iterations; i++) {
    console.log("iteration: ", i)
    updateTotalTime(totalTimeAgg, await prove(backend, inputs));
    prevDisplay = display(
      'logs',
      `Benched ${i + 1} iteration${
        i + 1 === 1 ? '' : 's'
      } of ${iterations} for ${proveWith}... ⏳`,
      prevDisplay 
    );
  }

  backend.destroy();

  const avg = calcAvg(totalTimeAgg, iterations);
  display('logs', `Witness generation time: ${avg.witnessGenerationTime}s ✅`);
  display('logs', `Proof generation time: ${avg.proofGenerationTime}s ✅`);
  // display('logs', `Proof verification time: ${avg.proofVerificationTime}s ✅`);
  display('logs', `Total time: ${avg.totalTime}s ✅`);
};

const updateTotalTime = (total, iteration) => {
  total.proofGenerationTime += iteration.proofGenerationTime;
  total.proofVerificationTime += iteration.proofVerificationTime;
  total.totalTime += iteration.totalTime;
  total.witnessGenerationTime += iteration.witnessGenerationTime;
};

document
  .getElementById('proveUltraHonk')
  .addEventListener('click', async () => await proveBackend('honk'));
document
  .getElementById('proveUltraPlonk')
  .addEventListener('click', async () => await proveBackend('plonk'));
