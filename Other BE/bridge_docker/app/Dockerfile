FROM python:3.11-slim
WORKDIR /app

COPY actiancortex-0.1.0b1-py3-none-any.whl /app/
RUN pip install /app/actiancortex-0.1.0b1-py3-none-any.whl

COPY bridge_http.py /app/bridge_http.py

EXPOSE 50052
CMD ["python","-u","/app/bridge_http.py"]
