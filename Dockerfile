FROM codercom/code-server:latest

USER root

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN npm install -g typescript tsx

WORKDIR /home/coder/ku-konnect

USER coder