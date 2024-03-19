from setuptools import setup


version = open("VERSION").read()

setup(
    name="nucliadb-admin-assets",
    version=version,
    description="Packaging of NucliaDB admin JS app",
    long_description_content_type="text/plain",
    long_description="",
    classifiers=[],
    keywords="",
    author="Nuclia",
    author_email="nucliadb@nuclia.com",
    url="https://github.com/nuclia/frontend",
    packages=["nucliadb_admin_assets"],
    zip_safe=True,
    include_package_data=True,
)
