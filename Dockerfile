FROM python:3.13-slim

WORKDIR /app
COPY . /app

ENV PORT=8123
ENV BIZPILOT_ENV=production

EXPOSE 8123

CMD ["python", "server.py"]
