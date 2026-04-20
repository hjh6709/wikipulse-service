from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    keycloak_url: str = "http://keycloak:8080"
    keycloak_realm: str = "wikipulse"
    keycloak_client_id: str = "wikipulse-api"

    redis_url: str = "redis://localhost:6379"

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "service-team"

    aws_region: str = "ap-northeast-2"
    lambda_function_name: str = "wikipulse-alert"

    use_mock: bool = True


settings = Settings()
