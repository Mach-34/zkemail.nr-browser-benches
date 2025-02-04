import circuit from '../circuit/target/noir_zkemail_benchmarks.json';
import { UltraHonkBackend, UltraPlonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import {
  generateEmailVerifierInputsFromDKIMResult,
  verifyDKIMSignature,
} from '@zk-email/zkemail-nr';

import initNoirC from '@noir-lang/noirc_abi';
import initACVM from '@noir-lang/acvm_js';

const noir = new Noir(circuit);

const inputParams = {
  maxHeadersLength: 512,
  maxBodyLength: 1024,
};

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

const handleInput = (event) => {
  const inputElement = event.target;
  const value = inputElement.value;
  const numericValue = value.replace(/[^0-9]/g, '');

  if (numericValue === '0') {
    inputElement.value = 1;
  } else {
    inputElement.value = numericValue;
  }

  const ultraHonkBtn = document.getElementById('proveUltraHonk');
  const ultraPlonkBtn = document.getElementById('proveUltraPlonk');
  // if input is empty then disable buttons
  if (numericValue.trim() === '') {
    ultraHonkBtn.disabled = true;
    ultraPlonkBtn.disabled = true;
  } else {
    ultraHonkBtn.disabled = false;
    ultraPlonkBtn.disabled = false;
  }
};

const generateInputs = async () => {
  const email = await fetch('./email-good-large.eml');
  const emailBuffer = await email.arrayBuffer();
  const dkimResult = await verifyDKIMSignature(Buffer.from(emailBuffer));
  const baseInputs = await generateEmailVerifierInputsFromDKIMResult(
    dkimResult,
    inputParams
  );

  // determine date sequence
  const header = dkimResult.headers.toString();
  const dateField = /[Dd]ate:.*\r?\n/.exec(header);
  const subjectField = /[Ss]ubject:.*\r?\n/.exec(header);

  return {
    subject_sequence: {
      index: String(subjectField.index),
      length: String(subjectField[0].length - 2), // remove 2 for crlf
    },
    date_index: String(dateField.index),
    ...baseInputs,
  };
};

const prove = async (backend, inputs) => {
  const start = new Date().getTime() / 1000;
  console.log('executing witness');
  const { witness } = await noir.execute(inputs);
  const postWitnessGenerationTime = new Date().getTime() / 1000;
  console.log('generating proof');
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
  const concurrencyToggle = document.getElementById('concurrencyToggle');
  const isConcurrencyEnabled = concurrencyToggle.checked;
  const iterations = Number(document.getElementById('iterations').value);

  // disable buttons while running
  const proveHonkBtn = document.getElementById('proveUltraHonk');
  const provePlonkBtn = document.getElementById('proveUltraPlonk');
  proveHonkBtn.disabled = true;
  provePlonkBtn.disabled = true;

  const backendOptions = { threads: 0 };
  if (isConcurrencyEnabled) {
    const threads = window.navigator.hardwareConcurrency;
    backendOptions.threads = threads;
  }

  await Promise.all([
    initACVM(
      new URL(
        '@noir-lang/acvm_js/web/acvm_js_bg.wasm',
        import.meta.url
      ).toString()
    ),
    initNoirC(
      new URL(
        '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm',
        import.meta.url
      ).toString()
    ),
  ]);
  const backend =
    proveWith === 'honk'
      ? new UltraHonkBackend(circuit.bytecode, backendOptions)
      : new UltraPlonkBackend(circuit.bytecode, backendOptions);
  const totalTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };
  const inputs = await generateInputs();
  // clear logs
  const logs = document.getElementById('logs');
  logs.innerHTML = '';
  if (isConcurrencyEnabled) {
    display(
      'logs',
      `Using ${backendOptions.threads} thread${
        backendOptions.threads > 1 ? 's' : ''
      } 🧵`
    );
  }
  let prevDisplay = display(
    'logs',
    `Benching ${proveWith} for ${iterations} iteration${
      iterations === 1 ? '' : 's'
    }... ⏳\n\n`
  );
  // do cold start proof
  const coldRes = await prove(backend, inputs);
  display(
    'logs',
    `Cold start witness generation time: ${coldRes.witnessGenerationTime}s ✅`
  );
  display(
    'logs',
    `Cold start proof generation time: ${coldRes.proofGenerationTime}s ✅`
  );
  display('logs', `Cold start total time: ${coldRes.totalTime}s ✅`);
  prevDisplay = display(
    'logs',
    `Benched 1 iteration of ${iterations} for ${proveWith}... ⏳`,
    prevDisplay
  );
  for (let i = 1; i < iterations; i++) {
    console.log('iteration: ', i);
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

  // re-enable buttons
  proveHonkBtn.disabled = false;
  provePlonkBtn.disabled = false;
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
document.getElementById('iterations').addEventListener('input', handleInput);
