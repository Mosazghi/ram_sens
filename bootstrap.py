import zipfile

def main():
    with zipfile.ZipFile('ram_sens.zip', 'w', zipfile.ZIP_DEFLATED) as zipper:
        zipper.write('extension.js')
        zipper.write('metadata.json')

if __name__ == "__main__":
    main()
