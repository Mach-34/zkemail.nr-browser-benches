# ZKEmail.nr Benchmarks
Benchmarking repository for [ZKEmail.nr](https://github.com/zkemail/zkemail.nr)


 * M1 Mac 16 gb memory
 * 222,783 gate circuit (default [[2048-bit DKIM verification circuit](https://github.com/zkemail/zkemail.nr/blob/main/examples/verify_email_2048_bit_dkim/src/main.nr) - 512 byte header & 1024 byte body])

|            | Plonk (Browser) | Honk (Browser) | Plonk (NodeJS) | Honk (NodeJS) | Plonk (Native) | Honk (Native) |
|------------|-----------------|----------------|----------------|---------------|----------------|---------------|
| Cold Start (Single Thread) | 89.01s          | 19.63s         | 88.26s         | 20.14s         |  N/A           | N/A           |
| Cold Start (Multithreaded) | **22.10s**          | **6.18s**         | **21.51s**         | **6.47s**         |  N/A           | N/A           |
| 10x avg (Single Thread)    | 59.50s          | 16.63s          | 59.37s         | 16.90s         | **6.81s**          | **2.34s**         |
| 10x avg (Multithreaded)    | **12.59s**          | **4.23s**          | **12.72s**         | **4.43s**         | N/A          | N/A        |
| Witcalc    | .75s           |  <---          | .88s          |  <---         | .90s          | <---          |  

Keep in mind that most of cold start cost can be hidden from user if proving backend is initialized eagerly on page load before user reaches proving UX

## Running Benchmarks yourself

REQUIRES NARGO v1.0.0.beta

REQUIRES BB v0.66.0

Run `./artifact.sh` to recompile the circuit to start off.

### Browser (Wasm)
```console
cd browser
yarn
yarn dev
# Click the buttons to prove plonk or honk and see output. Specify iterations and toggle concurrency on / off
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
