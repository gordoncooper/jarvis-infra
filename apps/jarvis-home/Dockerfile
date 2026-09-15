FROM node:22-bookworm-slim
WORKDIR /app/output
COPY output/ ./
# Install srvx *in this directory* so the binary is ./node_modules/.bin/srvx.
# Do not use `npx`: in a non-TTY pod it prompts to download and hangs forever,
# so kubelet sees Running + Restarts 0 while :3000 stays connection-refused.
RUN npm init -y >/dev/null \
 && npm install --omit=dev srvx@0.11.22
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
# --prod: no --watch fork. --static is resolved against --dir (cwd), not the entry file.
CMD ["node", "./node_modules/srvx/bin/srvx.mjs", "--prod", "--host", "0.0.0.0", "--port", "3000", "--dir", ".", "--static", "static", "--entry", "functions/__server.func/index.mjs"]
