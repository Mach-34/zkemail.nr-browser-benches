#!/bin/bash
cd circuit
nargo compile --force --silence-warnings
bb gates -b target/noir_zkemail_benchmarks.json | grep "circuit"