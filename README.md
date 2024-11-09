# ZKEmail.nr Benchmarks

M1 Mac 16 gb memory

## Browser
10 iterations

### Plonk

#### Cold Start (I.e. has to download srs)

```
Proof time:
```

#### Average warm
```
Witness Calculation


## Running Benchmarks yourself
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