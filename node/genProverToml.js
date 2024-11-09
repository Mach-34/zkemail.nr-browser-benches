import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const email = readFileSync(join(__dirname, './email-good-large.eml'));


const toProverToml = (inputs) => {
    const lines = [];
    const structs = [];
    for (const [key, value] of Object.entries(inputs)) {
        if (Array.isArray(value)) {
            const valueStrArr = value.map((val) => `'${val}'`);
            lines.push(`${key} = [${valueStrArr.join(", ")}]\n`);
        } else if (typeof value === "string") {
            lines.push(`${key} = '${value}'\n`);
        } else {
            let values = "";
            for (const [k, v] of Object.entries(value)) {
                if (Array.isArray(v)) {
                    values = values.concat(`${k} = [${v.map((val) => `'${val}'`).join(", ")}]\n`);
                } else {
                    values = values.concat(`${k} = '${v}'\n`);
                }
            }
            structs.push(`[${key}]\n${values}`);
        }
    }
    return lines.concat(structs).join("\n");
}

const main = async () => {
    const inputs = await generateEmailVerifierInputs(email, {
        maxHeadersLength: 512,
        maxBodyLength: 1024
    });
    const toml = toProverToml(inputs);
    writeFileSync(join(__dirname, '../circuit/Prover.toml'), toml);
}

main();