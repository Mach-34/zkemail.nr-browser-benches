// import circuit from '../circuit/target/circuit.json';
import circuit from '../circuit/target/noir_zkemail_benchmarks.json' assert { type: "json" };
import {
  BarretenbergBackend,
  UltraHonkBackend,
} from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const email = readFileSync(join(__dirname, './email-good-large.eml'));

const noir = new Noir(circuit);

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
  const { witness } = await noir.execute(inputs);
  const postWitnessGenerationTime = new Date().getTime() / 1000;
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
  const backend = proveWith === 'honk'
    ? new UltraHonkBackend(circuit)
    : new BarretenbergBackend(circuit);

  const iterations = 5;

  const totalTimeAgg = {
    proofGenerationTime: 0,
    proofVerificationTime: 0,
    totalTime: 0,
    witnessGenerationTime: 0,
  };

  const inputs = await generateEmailVerifierInputs(email, {
    maxHeadersLength: 512,
    maxBodyLength: 1024
  });

  console.log(
    `Benching ${proveWith} for ${iterations} iteration${
      iterations === 1 ? '' : 's'
    }... ⏳\n\n`
  );
  // do cold start proof
  const coldRes = await prove(backend, inputs);
  console.log(`Cold start witness generation time: ${coldRes.witnessGenerationTime}s ✅`);
  console.log(`Cold start proof generation time: ${coldRes.proofGenerationTime}s ✅`);
  console.log(`Cold start total time: ${coldRes.totalTime}s ✅`);

  for (let i = 1; i < iterations; i++) {
    updateTotalTime(totalTimeAgg, await prove(backend, inputs));
    console.log(
      `Benched ${i + 1} iteration${
        i + 1 === 1 ? '' : 's'
      } of ${iterations} for ${proveWith}... ⏳`,
    );
  }

  backend.destroy();

  const avg = calcAvg(totalTimeAgg, iterations);
  console.log(`Witness generation time: ${avg.witnessGenerationTime}s ✅`);
  console.log(`Proof generation time: ${avg.proofGenerationTime}s ✅`);
  console.log(`Total time: ${avg.totalTime}s ✅`);
};

const updateTotalTime = (total, iteration) => {
  total.proofGenerationTime += iteration.proofGenerationTime;
  total.proofVerificationTime += iteration.proofVerificationTime;
  total.totalTime += iteration.totalTime;
  total.witnessGenerationTime += iteration.witnessGenerationTime;
};

const main = async () => {
    await proveBackend("honk");
    await proveBackend("plonk");
}

main();