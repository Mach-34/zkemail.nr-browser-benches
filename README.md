# ZKEmail.nr Benchmarks
Benchmarking repository for [ZKEmail.nr](https://github.com/zkemail/zkemail.nr)


 * M1 Mac 16 gb memory
 * 222,783 gate circuit (default [[2048-bit DKIM verification circuit](https://github.com/zkemail/zkemail.nr/blob/main/examples/verify_email_2048_bit_dkim/src/main.nr) - 512 byte header & 1024 byte body])

|            | Plonk (Browser) | Honk (Browser) | Plonk (NodeJS) | Honk (NodeJS) | Plonk (Native) | Honk (Native) |
|------------|-----------------|----------------|----------------|---------------|----------------|---------------|
| Cold Start | 39.94s          | 16.80s         | 25.87s         | 9.32s         |  N/A           | N/A           |
| 10x avg    | 18.93s          | 9.67s          | 14.63s         | 5.87s         | 6.81s          | 2.51s         |
| Witcalc    | 2.27s           |  <---          | 1.37s          |  <---         | 2.43s          | <---          |  



## Running Benchmarks yourself

REQUIRES NARGO v0.35.0 (2a0d211b92d002fa75855d4ba27267f8892dd52c)
REQUIRES BB v0.57.0

Run `./artifact.sh` to recompile the circuit to start off.

### Browser (Wasm)
```console
cd browser
yarn
yarn dev
# Click the buttons to prove plonk or honk and see output
```

### NodeJS (Wasm)
```console
cd node
yarn
yarn start
```

### Native
```console
## If you want to rebuild the Prover.toml do this, otherwise skip...
cd browser
yarn
yarn gen_prover_toml
cd ..

# Run Plonk Test (1 iteration)
./native_plonk.sh

# Run Honk Test (1 iteration)
./native_honk.sh
```