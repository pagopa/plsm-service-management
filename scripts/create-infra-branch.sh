#!/bin/bash
# Helper script to create infrastructure branches following best practices

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Infrastructure Branch Creator${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
    git status -s
    echo ""
    read -p "Do you want to stash them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash push -m "Auto-stash before creating infra branch"
        echo -e "${GREEN}✅ Changes stashed${NC}"
    else
        echo -e "${RED}❌ Please commit or stash your changes first${NC}"
        exit 1
    fi
fi

# Prompt for branch name
echo ""
echo -e "${BLUE}What infrastructure change are you making?${NC}"
echo "Examples:"
echo "  - add-kv-secret-for-pippo"
echo "  - update-app-service-env-vars"
echo "  - create-new-function-app"
echo ""
read -p "Branch name (will be prefixed with 'infra/'): " BRANCH_NAME

# Validate branch name
if [[ -z "$BRANCH_NAME" ]]; then
    echo -e "${RED}❌ Branch name cannot be empty${NC}"
    exit 1
fi

FULL_BRANCH_NAME="infra/$BRANCH_NAME"

# Switch to main and pull latest
echo ""
echo -e "${BLUE}📥 Updating main branch...${NC}"
git checkout main
git pull origin main

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$FULL_BRANCH_NAME"; then
    echo -e "${RED}❌ Branch $FULL_BRANCH_NAME already exists${NC}"
    read -p "Do you want to switch to it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout "$FULL_BRANCH_NAME"
    fi
    exit 0
fi

# Create new branch
echo -e "${GREEN}✅ Creating branch: $FULL_BRANCH_NAME${NC}"
git checkout -b "$FULL_BRANCH_NAME"

# Print next steps
echo ""
echo -e "${GREEN}🎉 Infrastructure branch created!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Make your infrastructure changes in infra/resources/"
echo "2. Commit your changes:"
echo -e "   ${YELLOW}git add infra/${NC}"
echo -e "   ${YELLOW}git commit -m 'feat(infra): your change description'${NC}"
echo "3. Push your branch:"
echo -e "   ${YELLOW}git push -u origin $FULL_BRANCH_NAME${NC}"
echo "4. Create a Pull Request:"
echo -e "   ${YELLOW}gh pr create --template infra_change.md${NC}"
echo "5. After merge, sync your feature branch:"
echo -e "   ${YELLOW}git checkout $CURRENT_BRANCH && git merge main${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember: Only modify files in infra/ directory!${NC}"
echo ""
