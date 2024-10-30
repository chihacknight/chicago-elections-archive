FROM node:18

# Create app directory
WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends pip python-is-python3

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY requirements.txt ./

RUN npm install
RUN npm install -g mapshaper
RUN git clone https://github.com/mapbox/tippecanoe.git
RUN cd tippecanoe && make -j && make install
RUN pip install -r requirements.txt --break-system-packages

# Bundle app source
COPY . /usr/src/app/

RUN npm run build