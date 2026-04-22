FROM node:22-slim

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /home/claude

# Run as non-root user for security
RUN useradd -m -u 1001 claude && mkdir /workspace && chown -R claude:claude /workspace

USER claude

# Keep container running
ENTRYPOINT ["sleep", "infinity"]

