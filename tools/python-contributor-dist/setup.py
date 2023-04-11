from setuptools import setup


version = open("VERSION").read()

setup(
    name="nucliadb-contributor-assets",
    version=version,
    description="Packaging of NulcliaDB Contributor JS app",
    long_description="",
    classifiers=[],
    keywords="",
    author="Nuclia",
    author_email="nucliadb@nuclia.com",
    url="https://github.com/nucliadb/frontend",
    packages=["nucliadb_contributor_assets"],
    zip_safe=True,
    include_package_data=True,
    package_data={"nucliadb_contributor_assets": ["**/*"]},
)
