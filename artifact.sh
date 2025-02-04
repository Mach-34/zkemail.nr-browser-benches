#!/bin/bash
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
cd $SCRIPT_DIR

EXPECTED_NARGO_VERSION="1.0.0-beta.1"
EXPECTED_BB_VERSION="0.66.0"

NOIRUP_URL="https://raw.githubusercontent.com/noir-lang/noirup/main/install"
BBUP_URL="https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# windows users go use wsl
refresh_shell() {
    local success=0
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - try common profile files
        if [ -f ~/.bash_profile ]; then
            source ~/.bash_profile
            success=1
            elif [ -f ~/.profile ]; then
            source ~/.profile
            success=1
            elif [ -f ~/.bashrc ]; then
            source ~/.bashrc
            success=1
        fi
    else
        # Linux - typically uses .bashrc
        if [ -f ~/.bashrc ]; then
            source ~/.bashrc
            success=1
        fi
    fi
    
    if [ $success -eq 0 ]; then
        echo "No profile file found in home directory"
        return 1
    fi
    return 0
}


check_installer() {
    local NAME=$1
    local URI=$2
    if ! command -v $NAME >/dev/null 2>&1; then
        echo -e "${RED}✗${NC} $NAME is not installed, installing..."
        temp_installer=$(mktemp)
        curl -s -L $URI > "$temp_installer"
        bash "$temp_installer"
        rm "$temp_installer"
    fi
    echo -e "${GREEN}✓${NC} $NAME is installed"

}

check_binary() {
    local NAME=$1 # name of the binary (nargo/bb)
    local INSTALLER=$2 # name of installer (noirup/bbup)
    local EXPECTED_VERSION=$3 # expected version
    local raw_version=$($NAME --version)

    if ! command -v $NAME >/dev/null 2>&1; then
        echo -e "${RED}✗${NC} $NAME is not installed, installing..."
        $INSTALLER -v $EXPECTED_VERSION
    fi
    if echo "$raw_version" | grep -q "version ="; then
        version=$(echo "$raw_version" | grep "^$NAME version" | awk -F'=' '{print $2}' | tr -d ' ' | tr -d '\n')
    else
        version=$(echo "$raw_version" | tr -d '\n')
    fi
    if [ "$version" != "$EXPECTED_VERSION" ]; then
        echo -e "${RED}✗${NC} $NAME version $version is incorrect, installing version $EXPECTED_VERSION..."
        $INSTALLER -v $EXPECTED_VERSION
    fi
    echo -e "${GREEN}✓${NC} $NAME version $version is installed"
}

check_installer "noirup" $NOIRUP_URL
check_binary "nargo" "noirup" $EXPECTED_NARGO_VERSION
check_installer "bbup" $BBUP_URL
check_binary "bb" "bbup" $EXPECTED_BB_VERSION


cd circuit
nargo compile --force --silence-warnings
nargo info --silence-warnings
CIRCUIT_SIZE=$(bb gates -b ./target/noir_zkemail_benchmarks.json | grep "circuit" | grep -o '[0-9]\+')
echo -e "Circuit size: ${BLUE}$CIRCUIT_SIZE${NC} gates"