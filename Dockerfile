FROM node:17

# Create app directory
WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends pip python-is-python3

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY pyproject.toml .

RUN pip install poetry
RUN pip install esridump
RUN poetry install
RUN npm install
RUN npm install -g mapshaper
RUN git clone https://github.com/mapbox/tippecanoe.git
RUN cd tippecanoe && make -j && make install

# Bundle app source
COPY . .

RUN poetry run make all